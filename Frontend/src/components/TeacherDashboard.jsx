import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import LatexRenderer from './LatexRenderer';

const DEFAULT_OPTIONS = () => [
  { label: 'A', text: '' },
  { label: 'B', text: '' },
  { label: 'C', text: '' },
  { label: 'D', text: '' },
];

const SAMPLE_PAPER = {
  name: 'Science Annual Examination (Class V)',
  description: 'DPS Bangalore North Academic Session 2025-2026',
  subject: 'Science',
  grade: 5,
  duration: 60,
  max_marks: 50,
  filename: 'Science_Annual_Exam.pdf',
  questions: [
    {
      question_number: 1,
      type: 'objective',
      heading: 'I. MULTIPLE CHOICE QUESTIONS',
      question: 'Ravi wants to load a heavy box into a truck. Why does using a ramp make his work easier?',
      options: [
        { label: 'A', text: 'It increases the weight of the box.' },
        { label: 'B', text: 'It reduces the distance moved.' },
        { label: 'C', text: 'It reduces the force needed.' },
        { label: 'D', text: 'It changes the shape of the box.' },
      ],
      marks: 1,
    },
    {
      question_number: 2,
      type: 'subjective',
      heading: 'II. ANSWER THE FOLLOWING',
      question: 'Why is a screw better than a nail?',
      options: [],
      marks: 2,
    },
  ],
};

const HEADING_PRESETS = [
  'I. MULTIPLE CHOICE QUESTIONS',
  'II. NAME THE FOLLOWING',
  'III. ANSWER THE FOLLOWING',
  'IV. LONG ANSWER QUESTIONS',
];

const MARK_PRESETS = [1, 2, 3, 5];

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatEvaluatedDate = (rawDate) => {

  if (!rawDate) return '—';

  const normalized = String(rawDate).trim().replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return String(rawDate).split(' ')[0];
  }

  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const displayName = user?.name || user?.username || 'Teacher';

  // Paper metadata state matching reqExample.json
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState(5);
  const [duration, setDuration] = useState(60);
  const [maxMarks, setMaxMarks] = useState(50);
  const [customFilename, setCustomFilename] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // End date must not precede start date
  const dateRangeError = useMemo(() => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return 'End date must be on or after the start date.';
    }
    return '';
  }, [startDate, endDate]);

  // Questions list state matching reqExample.json
  const [questions, setQuestions] = useState([
    {
      question_number: 1,
      type: 'objective',
      heading: 'I. MULTIPLE CHOICE QUESTIONS',
      question: '',
      options: DEFAULT_OPTIONS(),
      marks: 1,
    },
  ]);

  // UI states
  const [activeView, setActiveView] = useState('compose'); // 'compose' | 'upload'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [formattingLatex, setFormattingLatex] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [generatedResult, setGeneratedResult] = useState(null);

  // ─────────────────────────────────────────────
  // Upload Evaluated Paper Section State
  // ─────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [availablePapers, setAvailablePapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [uploadPaperId, setUploadPaperId] = useState('');
  const [uploadStudentId, setUploadStudentId] = useState('');
  const [uploadMarksObtained, setUploadMarksObtained] = useState('');
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', text: '' });
  const [uploadedEvaluatedList, setUploadedEvaluatedList] = useState([]);
  const [evaluatedPapersRaw, setEvaluatedPapersRaw] = useState({
    signedUrl: [],
    paperids: [],
    student_ids: [],
    total_marks: [],
    created_at: [],
  });

  const fetchTeacherEvaluatedPapers = async () => {
    const teacherId = user?.id || 1;
    try {
      const evalRes = await axios.get(`${API_BASE_URL}/api/evaluated/teacher/${teacherId}`);
      if (evalRes.data) {
        setEvaluatedPapersRaw({
          signedUrl: Array.isArray(evalRes.data.signedUrl) ? evalRes.data.signedUrl : [],
          paperids: Array.isArray(evalRes.data.paperids) ? evalRes.data.paperids : [],
          student_ids: Array.isArray(evalRes.data.student_ids) ? evalRes.data.student_ids : [],
          total_marks: Array.isArray(evalRes.data.total_marks) ? evalRes.data.total_marks : [],
          created_at: Array.isArray(evalRes.data.created_at) ? evalRes.data.created_at : [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch teacher evaluated papers:', err);
    }
  };

  const fetchAvailablePapers = async () => {
    setLoadingPapers(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/papers`);
      if (Array.isArray(res.data)) {
        setAvailablePapers(res.data);
        setUploadPaperId((prev) => {
          const exists = res.data.some((p) => String(p.id) === String(prev));
          return exists ? String(prev) : '';
        });
      } else {
        setAvailablePapers([]);
        setUploadPaperId('');
      }
    } catch (err) {
      console.error('Failed to fetch available papers:', err);
      setAvailablePapers([]);
      setUploadPaperId('');
    } finally {
      setLoadingPapers(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const stuRes = await axios.get(`${API_BASE_URL}/api/students`);
      if (Array.isArray(stuRes.data)) {
        const normalizedStudents = stuRes.data.map((s) => ({
          id: String(s.id),
          name: s.name || s.Username || s.username || `Student #${s.id}`,
        }));
        setAvailableStudents(normalizedStudents);
      } else {
        setAvailableStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch available students:', err);
      setAvailableStudents([]);
    }
  };

  // Fetch existing papers & available students from backend
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setLoadingPapers(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/papers`);
        if (isMounted && Array.isArray(res.data)) {
          setAvailablePapers(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch available papers:', err);
      } finally {
        if (isMounted) setLoadingPapers(false);
      }

      try {
        const stuRes = await axios.get(`${API_BASE_URL}/api/students`);
        if (isMounted && Array.isArray(stuRes.data)) {
          const normalizedStudents = stuRes.data.map((s) => ({
            id: String(s.id),
            name: s.name || s.Username || s.username || `Student #${s.id}`,
          }));
          setAvailableStudents(normalizedStudents);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }

      const teacherId = user?.id || 1;
      try {
        const evalRes = await axios.get(`${API_BASE_URL}/api/evaluated/teacher/${teacherId}`);
        if (isMounted && evalRes.data) {
          setEvaluatedPapersRaw({
            signedUrl: Array.isArray(evalRes.data.signedUrl) ? evalRes.data.signedUrl : [],
            paperids: Array.isArray(evalRes.data.paperids) ? evalRes.data.paperids : [],
            student_ids: Array.isArray(evalRes.data.student_ids) ? evalRes.data.student_ids : [],
            total_marks: Array.isArray(evalRes.data.total_marks) ? evalRes.data.total_marks : [],
            created_at: Array.isArray(evalRes.data.created_at) ? evalRes.data.created_at : [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch teacher evaluated papers:', err);
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Refresh available papers, students, and evaluated papers when switching to the Upload Paper tab
  useEffect(() => {
    if (activeView === 'upload') {
      fetchAvailablePapers();
      fetchAvailableStudents();
      fetchTeacherEvaluatedPapers();
    }
  }, [activeView]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Derived filename if customFilename is left blank
  const resolvedFilename = useMemo(() => {
    const raw = customFilename.trim()
      ? customFilename.trim()
      : name.trim()
        ? `${name.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
        : 'Assessment_Paper.pdf';
    return raw.endsWith('.pdf') ? raw : `${raw}.pdf`;
  }, [customFilename, name]);

  // Total allocated marks across all questions
  const allocatedMarks = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    [questions]
  );

  const objectiveCount = useMemo(
    () => questions.filter((q) => q.type === 'objective').length,
    [questions]
  );

  const subjectiveCount = questions.length - objectiveCount;

  // Build exact reqExample.json payload
  const requestPayload = useMemo(() => {
    return {
      name: name.trim() || 'Untitled Assessment Paper',
      description: description.trim(),
      subject: subject.trim() || 'General',
      grade: Number(grade) || 1,
      duration: Number(duration) || 60,
      max_marks: Number(maxMarks) || allocatedMarks || 0,
      filename: resolvedFilename,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      questions: questions.map((q, idx) => ({
        question_number: idx + 1,
        type: q.type,
        heading: q.heading.trim(),
        question: q.question.trim(),
        options:
          q.type === 'objective'
            ? (q.options || []).map((opt, oIdx) => ({
              label: opt.label || String.fromCharCode(65 + oIdx),
              text: opt.text || '',
            }))
            : [],
        marks: Number(q.marks) || 1,
      })),
    };
  }, [name, description, subject, grade, duration, maxMarks, allocatedMarks, resolvedFilename, startDate, endDate, questions]);

  // Question manipulation handlers
  const addQuestion = (type = 'objective') => {
    setQuestions((prev) => {
      const lastQuestion = prev[prev.length - 1];
      const defaultHeading =
        lastQuestion && lastQuestion.type === type
          ? lastQuestion.heading
          : type === 'objective'
            ? 'I. MULTIPLE CHOICE QUESTIONS'
            : 'II. ANSWER THE FOLLOWING';

      return [
        ...prev,
        {
          question_number: prev.length + 1,
          type,
          heading: defaultHeading,
          question: '',
          options: type === 'objective' ? DEFAULT_OPTIONS() : [],
          marks: type === 'objective' ? 1 : 2,
        },
      ];
    });
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((q, idx) => ({ ...q, question_number: idx + 1 }))
    );
  };

  const moveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      return copy.map((q, idx) => ({ ...q, question_number: idx + 1 }));
    });
  };

  const updateQuestionField = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== index) return q;
        if (field === 'type') {
          const nextType = value;
          return {
            ...q,
            type: nextType,
            options:
              nextType === 'objective'
                ? q.options && q.options.length > 0
                  ? q.options
                  : DEFAULT_OPTIONS()
                : [],
            heading:
              nextType === 'objective' && q.heading === 'II. ANSWER THE FOLLOWING'
                ? 'I. MULTIPLE CHOICE QUESTIONS'
                : nextType === 'subjective' && q.heading === 'I. MULTIPLE CHOICE QUESTIONS'
                  ? 'II. ANSWER THE FOLLOWING'
                  : q.heading,
          };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const updateOptionText = (qIndex, optIndex, textValue) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const nextOptions = (q.options || []).map((opt, oIdx) =>
          oIdx === optIndex ? { ...opt, text: textValue } : opt
        );
        return { ...q, options: nextOptions };
      })
    );
  };

  const handleLoadSample = () => {
    setName(SAMPLE_PAPER.name);
    setDescription(SAMPLE_PAPER.description);
    setSubject(SAMPLE_PAPER.subject);
    setGrade(SAMPLE_PAPER.grade);
    setDuration(SAMPLE_PAPER.duration);
    setMaxMarks(SAMPLE_PAPER.max_marks);
    setCustomFilename(SAMPLE_PAPER.filename);
    setQuestions(
      SAMPLE_PAPER.questions.map((q) => ({
        ...q,
        options:
          q.type === 'objective'
            ? q.options.map((o) => ({ ...o }))
            : [],
      }))
    );
    setStatusMessage({ type: '', text: '' });
    setGeneratedResult(null);
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setSubject('');
    setGrade(5);
    setDuration(60);
    setMaxMarks(50);
    setCustomFilename('');
    setStartDate('');
    setEndDate('');
    setQuestions([
      {
        question_number: 1,
        type: 'objective',
        heading: 'I. MULTIPLE CHOICE QUESTIONS',
        question: '',
        options: DEFAULT_OPTIONS(),
        marks: 1,
      },
    ]);
    setStatusMessage({ type: '', text: '' });
    setGeneratedResult(null);
  };

  const validateForm = () => {
    if (!name.trim()) return 'Please enter a paper title.';
    if (!subject.trim()) return 'Please enter a subject.';
    if (!startDate) return 'Please select a start date for the paper.';
    if (!endDate) return 'Please select an end date for the paper.';
    if (dateRangeError) return dateRangeError;
    if (questions.length === 0) return 'Please add at least one question.';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        return `Please enter the question prompt for Question ${i + 1}.`;
      }
      if (q.type === 'objective') {
        const hasEmptyOption = (q.options || []).some((opt) => !opt.text.trim());
        if (hasEmptyOption) {
          return `Please fill in all 4 options (A, B, C, D) for Question ${i + 1}.`;
        }
      }
    }
    return null;
  };

  const handleFormatLatex = async () => {

    setStatusMessage({ type: '', text: '' });
    setFormattingLatex(true);

    try {

      const latexRes = await axios.post(`${API_BASE_URL}/api/format-latex`, requestPayload);
      const formattedPayload = latexRes.data || requestPayload;

      if (Array.isArray(formattedPayload.questions)) {
        setQuestions(
          formattedPayload.questions.map((q, idx) => ({
            ...q,
            question_number: idx + 1,
            options: q.type === 'objective' ? q.options || DEFAULT_OPTIONS() : [],
          }))
        );
      }

      setStatusMessage({
        type: 'success',
        text: 'Questions converted to LaTeX format.',
      });

      return formattedPayload;

    } catch (error) {

      console.error('Error formatting LaTeX:', error);

      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to format questions into LaTeX.',
      });

      return null;

    } finally {

      setFormattingLatex(false);

    }
  };

  const handleGeneratePaper = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setGeneratedResult(null);

    const validationError = validateForm();
    if (validationError) {
      setStatusMessage({ type: 'error', text: validationError });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Convert questions & options into proper LaTeX format via Gemini Flash endpoint
      let finalPayload = requestPayload;
      try {
        const latexRes = await axios.post(`${API_BASE_URL}/api/format-latex`, requestPayload);
        if (latexRes.data && Array.isArray(latexRes.data.questions)) {
          finalPayload = latexRes.data;
          setQuestions(
            finalPayload.questions.map((q, idx) => ({
              ...q,
              question_number: idx + 1,
              options: q.type === 'objective' ? q.options || DEFAULT_OPTIONS() : [],
            }))
          );
        }
      } catch (latexErr) {
        console.warn('LaTeX formatting step failed, proceeding with original payload:', latexErr);
      }

      // 2. Send the LaTeX-formatted payload to generate the paper PDF
      const response = await axios.post(`${API_BASE_URL}/api/generate`, finalPayload);
      setGeneratedResult(response.data);
      setStatusMessage({
        type: 'success',
        text: response.data?.message || 'Paper formatted to LaTeX and PDF saved to storage.',
      });

      // Refresh available papers from database so teacher can immediately select it
      await fetchAvailablePapers();
      if (response.data?.paperId) {
        setUploadPaperId(String(response.data.paperId));
      }
    } catch (error) {
      console.error('Error generating paper:', error);
      setStatusMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to generate paper PDF. Please check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Upload Evaluated Paper Handlers & Computed State
  // ─────────────────────────────────────────────
  const selectedUploadPaper = useMemo(
    () =>
      availablePapers.find((p) => String(p.id) === String(uploadPaperId)) || null,
    [availablePapers, uploadPaperId]
  );

  const selectedUploadPaperMaxMarks = useMemo(
    () => (selectedUploadPaper ? Number(selectedUploadPaper.max_marks) || 50 : 0),
    [selectedUploadPaper]
  );

  const uploadMarksError = useMemo(() => {
    if (uploadMarksObtained === '' || uploadMarksObtained === null || uploadMarksObtained === undefined) {
      return '';
    }
    const num = Number(uploadMarksObtained);
    if (Number.isNaN(num) || num < 0) {
      return 'Marks obtained cannot be negative.';
    }
    if (selectedUploadPaper && selectedUploadPaperMaxMarks > 0 && num > selectedUploadPaperMaxMarks) {
      return `Marks obtained cannot exceed maximum marks (${selectedUploadPaperMaxMarks}).`;
    }
    return '';
  }, [uploadMarksObtained, selectedUploadPaper, selectedUploadPaperMaxMarks]);

  const uploadCalculatedPercentage = useMemo(() => {
    if (uploadMarksObtained === '' || uploadMarksError || selectedUploadPaperMaxMarks <= 0) {
      return null;
    }
    return Math.round((Number(uploadMarksObtained) / selectedUploadPaperMaxMarks) * 100);
  }, [uploadMarksObtained, uploadMarksError, selectedUploadPaperMaxMarks]);

  const selectedUploadStudent = useMemo(
    () =>
      availableStudents.find((s) => String(s.id) === String(uploadStudentId)) || null,
    [availableStudents, uploadStudentId]
  );

  // Combine database evaluated papers from /api/evaluated/teacher/:teacherid with session uploads
  const displayedEvaluatedPapers = useMemo(() => {
    const {
      signedUrl = [],
      paperids = [],
      student_ids = [],
      total_marks = [],
      created_at = [],
    } = evaluatedPapersRaw;
    const dbRecords = signedUrl.map((url, idx) => {
      const paperId = paperids[idx];
      const studentId = student_ids[idx];
      const marks = Number(total_marks[idx]) || 0;
      const rawDate = created_at[idx];
      const matchedPaper = availablePapers.find((p) => String(p.id) === String(paperId));
      const matchedStudent = availableStudents.find((s) => String(s.id) === String(studentId));
      const maxMarks = Number(matchedPaper?.max_marks) || 50;
      const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
      return {
        id: `EVAL-DB-${paperId ?? idx}-${idx}`,
        paperId,
        paperName: matchedPaper?.name || `Paper #${paperId ?? idx + 1}`,
        subject: matchedPaper?.subject || 'General',
        grade: matchedPaper?.grade || 5,
        studentId,
        studentName: matchedStudent?.name || null,
        marksObtained: marks,
        maxMarks,
        percentage,
        fileUrl: url,
        uploadedAt: formatEvaluatedDate(rawDate),
      };
    });
    return dbRecords.length > 0 ? dbRecords : uploadedEvaluatedList;
  }, [evaluatedPapersRaw, availablePapers, availableStudents, uploadedEvaluatedList]);

  const processSelectedFile = (file) => {
    if (!file) return;
    setUploadStatus({ type: '', text: '' });

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadStatus({
        type: 'error',
        text: 'Please upload the evaluated paper in PDF (.pdf) format.',
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      processSelectedFile(droppedFile);
    }
  };

  const handleClearUploadForm = () => {
    setUploadedFile(null);
    setUploadMarksObtained('');
    setUploadStatus({ type: '', text: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadPaperSubmit = async (e) => {
    e.preventDefault();
    setUploadStatus({ type: '', text: '' });

    if (!uploadedFile) {
      setUploadStatus({
        type: 'error',
        text: 'Please attach the evaluated PDF paper file before submitting.',
      });
      return;
    }
    if (!selectedUploadPaper || !uploadPaperId) {
      setUploadStatus({ type: 'error', text: 'Please select an examination paper.' });
      return;
    }
    if (!selectedUploadStudent || !uploadStudentId) {
      setUploadStatus({ type: 'error', text: 'Please select a student.' });
      return;
    }
    if (uploadMarksObtained === '' || uploadMarksObtained === null) {
      setUploadStatus({ type: 'error', text: 'Please enter the total marks obtained by the student.' });
      return;
    }
    if (uploadMarksError) {
      setUploadStatus({ type: 'error', text: uploadMarksError });
      return;
    }

    setUploadingPaper(true);
    try {
      const obtainedNum = Number(uploadMarksObtained);
      const maxNum = selectedUploadPaperMaxMarks;
      const pct = maxNum > 0 ? Math.round((obtainedNum / maxNum) * 100) : 0;
      const filePreviewUrl = URL.createObjectURL(uploadedFile);

      // Prepare multipart FormData matching uploadController & paperRoute
      const formData = new FormData();
      formData.append('pdf', uploadedFile);
      formData.append('total_marks', obtainedNum);
      formData.append('student_id', 2);
      formData.append('teacher_id', 1);
      formData.append('paper_id', Number(selectedUploadPaper.id));

      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newRecord = {
        id: `EVAL-UP-${Date.now()}`,
        paperId: selectedUploadPaper.id,
        paperName: selectedUploadPaper.name,
        subject: selectedUploadPaper.subject || 'General',
        grade: selectedUploadPaper.grade || 5,
        studentId: 1,
        studentName: selectedUploadStudent?.name || 'Student #1',
        marksObtained: obtainedNum,
        maxMarks: maxNum,
        percentage: pct,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileUrl: filePreviewUrl,
        uploadedAt: new Date().toLocaleString(),
      };

      setUploadedEvaluatedList((prev) => [newRecord, ...prev]);
      await fetchTeacherEvaluatedPapers();
      setUploadStatus({
        type: 'success',
        text:
          response.data?.message ||
          `Evaluated paper uploaded successfully for ${newRecord.studentName} — ${newRecord.paperName} (${newRecord.marksObtained}/${newRecord.maxMarks} marks).`,
      });
      setUploadedFile(null);
      setUploadMarksObtained('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error uploading evaluated paper:', err);
      setUploadStatus({
        type: 'error',
        text:
          err.response?.data?.message ||
          err.message ||
          'Failed to upload evaluated paper. Please check server logs.',
      });
    } finally {
      setUploadingPaper(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-[#f5f5f5] text-[#292524] relative overflow-x-hidden font-sans selection:bg-[#292524] selection:text-white">

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 right-1/4 w-150 h-150 rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)',
          }}
        />
        <div
          className="absolute top-110 -left-32 w-135 h-135 rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 45%, transparent 75%)',
          }}
        />
      </div>


      <div className="sticky top-3 sm:top-4 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6">
        <header className="w-full h-15 bg-white/90 backdrop-blur-md rounded-full border border-[#e7e5e4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] px-5 sm:px-6 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3.5 shrink-0">
            <div className="flex items-center gap-1 h-4 px-0.5" aria-hidden="true">
              <span className="w-0.5 h-3.5 bg-[#0c0a09] rounded-full" />
              <span className="w-0.5 h-5 bg-[#0c0a09] rounded-full" />
              <span className="w-0.5 h-2.5 bg-[#0c0a09] rounded-full" />
            </div>
            <span className="text-[15px] font-semibold tracking-[0.18em] text-[#0c0a09] uppercase select-none">
              VOICESCRIBE
            </span>
            <span className="hidden sm:inline-block w-px h-4 bg-[#e7e5e4]" aria-hidden="true" />
            <span className="hidden sm:inline-flex items-center text-[12px] font-semibold tracking-[0.08em] uppercase px-3 py-1 rounded-full bg-[#f0efed] text-[#0c0a09]">
              Paper Studio
            </span>
          </div>

          {/* Center: Workspace Mode Switcher Pills */}
          <nav
            aria-label="Teacher dashboard sections"
            className="hidden md:flex items-center p-1 rounded-full bg-[#f0efed] border border-[#e7e5e4]"
          >
            {[
              { id: 'compose', label: 'Compose Paper' },
              { id: 'upload', label: 'Upload Paper' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`h-8 px-4 rounded-full text-[13px] font-medium transition-all active:scale-[0.98] ${activeView === tab.id
                  ? 'bg-[#292524] text-white shadow-2xs'
                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleLoadSample}
              className="hidden sm:inline-flex items-center h-9 px-4 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#0c0a09] text-[#0c0a09] text-[13.5px] font-medium transition-all active:scale-[0.98]"
            >
              Load Sample
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 h-9 pl-1.5 pr-3 rounded-full bg-[#fafafa] hover:bg-white border border-[#e7e5e4] hover:border-[#d6d3d1] transition-all text-[14px] text-[#292524] active:scale-[0.98]"
                aria-label="User account menu"
                aria-expanded={isDropdownOpen}
              >
                <span className="w-6.5 h-6.5 rounded-full bg-[#292524] text-white text-[12px] font-medium flex items-center justify-center shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium hidden sm:inline text-[13.5px] text-[#0c0a09]">
                  {displayName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-[#777169] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#e7e5e4] py-2 z-50">
                  <div className="px-4 py-3 border-b border-[#f0efed]">
                    <p className="text-[11px] text-[#777169] uppercase tracking-[0.08em] font-semibold">
                      Faculty Account
                    </p>
                    <p className="text-[14.5px] font-medium text-[#0c0a09] truncate mt-0.5">{displayName}</p>
                  </div>
                  <div className="pt-1.5 px-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-[13.5px] text-[#dc2626] hover:bg-[#fef2f2] rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>


      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-16 flex-1 flex flex-col gap-8 z-10">

        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f0efed] text-[12px] font-semibold tracking-[0.08em] uppercase text-[#0c0a09] mb-4">
              {activeView === 'compose' ? 'Assessment Authoring' : 'Evaluated Scripts'}
            </span>
            {activeView === 'compose' ? (
              <>
                <h1 className="font-serif font-light text-4xl sm:text-5xl text-[#0c0a09] tracking-[-0.03em] leading-[1.1] pb-1">
                  Compose an <span className="italic font-light">examination paper</span>.
                </h1>
                <p className="text-[16px] text-[#4e4e4e] leading-relaxed mt-2.5 max-w-[60ch]">
                  Define paper details, configure objective and subjective questions with marks, and generate a fillable PDF worksheet.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-serif font-light text-4xl sm:text-5xl text-[#0c0a09] tracking-[-0.03em] leading-[1.1] pb-1">
                  Upload an <span className="italic font-light">evaluated paper</span>.
                </h1>
                <p className="text-[16px] text-[#4e4e4e] leading-relaxed mt-2.5 max-w-[60ch]">
                  Choose the examination paper and student, enter the total marks obtained, and upload the evaluated PDF answer sheet.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 md:hidden">
            {[
              { id: 'compose', label: 'Compose Paper' },
              { id: 'upload', label: 'Upload Paper' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`h-9 px-3.5 rounded-full text-[13px] font-medium border transition-all active:scale-[0.98] ${activeView === tab.id
                  ? 'bg-[#292524] text-white border-[#292524]'
                  : 'bg-white text-[#4e4e4e] border-[#d6d3d1]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeView === 'compose' && (
          <form autoComplete="off" onSubmit={handleGeneratePaper} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            <div className="lg:col-span-8 flex flex-col gap-6">

              <section className="bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#f0efed]">
                  <div>
                    <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em] leading-[1.2]">
                      Paper Details
                    </h2>
                    <p className="text-[14px] text-[#777169] mt-1">
                      Header metadata printed at the top of the generated PDF worksheet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="hidden sm:inline-flex items-center h-9 px-4 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#0c0a09] text-[#292524] text-[13.5px] font-medium transition-all active:scale-[0.98]"
                  >
                    Clear Form
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                  {/* Paper Title (name) */}
                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <label htmlFor="paper-name" className="text-[14px] font-medium text-[#292524]">
                      Paper Title
                    </label>
                    <input
                      id="paper-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Science Annual Examination (Class V)"
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    />
                  </div>

                  {/* Subject */}
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <label htmlFor="paper-subject" className="text-[14px] font-medium text-[#292524]">
                      Subject
                    </label>
                    <input
                      id="paper-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Science"
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    />
                  </div>

                  {/* Description / Institution Header */}
                  <div className="sm:col-span-12 flex flex-col gap-2">
                    <label htmlFor="paper-description" className="text-[14px] font-medium text-[#292524]">
                      Institution or Session Description
                    </label>
                    <input
                      id="paper-description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., DPS Bangalore North Academic Session 2025-2026"
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                    />
                  </div>

                  {/* Grade */}
                  <div className="sm:col-span-4 flex flex-col gap-2">
                    <label htmlFor="paper-grade" className="text-[14px] font-medium text-[#292524]">
                      Grade / Class
                    </label>
                    <input
                      id="paper-grade"
                      type="number"
                      min="1"
                      max="12"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] tabular-nums outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    />
                  </div>

                  {/* Duration (mins) */}
                  <div className="sm:col-span-4 flex flex-col gap-2">
                    <label htmlFor="paper-duration" className="text-[14px] font-medium text-[#292524]">
                      Duration (Minutes)
                    </label>
                    <input
                      id="paper-duration"
                      type="number"
                      min="5"
                      step="5"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] tabular-nums outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    />
                  </div>

                  {/* Max Marks */}
                  <div className="sm:col-span-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="paper-max-marks" className="text-[14px] font-medium text-[#292524]">
                        Maximum Marks
                      </label>
                      {allocatedMarks > 0 && Number(maxMarks) !== allocatedMarks && (
                        <button
                          type="button"
                          onClick={() => setMaxMarks(allocatedMarks)}
                          className="text-[12px] font-medium text-[#292524] underline hover:text-[#0c0a09]"
                        >
                          Match sum ({allocatedMarks})
                        </button>
                      )}
                    </div>
                    <input
                      id="paper-max-marks"
                      type="number"
                      min="1"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] tabular-nums outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    />
                  </div>

                  {/* Availability Window */}
                  <div className="sm:col-span-6 flex flex-col gap-2">
                    <label htmlFor="paper-start-date" className="text-[14px] font-medium text-[#292524]">
                      Start Date
                    </label>
                    <input
                      id="paper-start-date"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      aria-describedby="paper-date-help"
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] tabular-nums outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    />
                  </div>

                  <div className="sm:col-span-6 flex flex-col gap-2">
                    <label htmlFor="paper-end-date" className="text-[14px] font-medium text-[#292524]">
                      End Date
                    </label>
                    <input
                      id="paper-end-date"
                      type="datetime-local"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      aria-invalid={Boolean(dateRangeError)}
                      aria-describedby="paper-date-help"
                      className={`w-full h-11 px-4 rounded-lg bg-white border text-[15px] text-[#0c0a09] tabular-nums outline-none focus:ring-1 transition-all ${dateRangeError
                        ? 'border-[#b91c1c] focus:border-[#b91c1c] focus:ring-[#b91c1c]'
                        : 'border-[#d6d3d1] focus:border-[#0c0a09] focus:ring-[#0c0a09]'
                        }`}
                      required
                    />
                  </div>

                  <p
                    id="paper-date-help"
                    className={`sm:col-span-12 -mt-2 text-[12.5px] ${dateRangeError ? 'text-[#b91c1c]' : 'text-[#777169]'}`}
                  >
                    {dateRangeError || 'Students can attempt the paper only within this window.'}
                  </p>

                  {/* Filename */}
                  <div className="sm:col-span-12 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="paper-filename" className="text-[14px] font-medium text-[#292524]">
                        PDF Filename
                      </label>
                      <span className="text-[12.5px] text-[#777169]">
                        Saved as: <span className="font-medium text-[#292524]">{resolvedFilename}</span>
                      </span>
                    </div>
                    <input
                      id="paper-filename"
                      type="text"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      placeholder="Leave blank to auto-generate from title (e.g., Science_Annual_Exam.pdf)"
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Step 2: Questions Builder Section */}
              <section className="bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0efed]">
                  <div>
                    <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em] leading-[1.2]">
                      Question Bank ({questions.length})
                    </h2>
                    <p className="text-[14px] text-[#777169] mt-1">
                      Choose objective (multiple choice) or subjective text questions and assign marks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => addQuestion('objective')}
                      className="h-10 px-4 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13.5px] font-medium transition-all active:scale-[0.98]"
                    >
                      + Objective
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('subjective')}
                      className="h-10 px-4 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#0c0a09] text-[#0c0a09] text-[13.5px] font-medium transition-all active:scale-[0.98]"
                    >
                      + Subjective
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="flex flex-col gap-6">
                  {questions.map((q, qIndex) => {
                    const isObjective = q.type === 'objective';
                    return (
                      <article
                        key={qIndex}
                        className="rounded-2xl border border-[#e7e5e4] bg-[#fafafa] p-5 sm:p-6 flex flex-col gap-5 transition-all"
                      >
                        {/* Top Bar: Question Number + Type Toggle + Reorder/Delete */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e7e5e4]">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-[#292524] text-white text-[13px] font-medium tabular-nums">
                              Question {qIndex + 1}
                            </span>

                            {/* Segmented Pill Toggle for Question Type */}
                            <div
                              className="inline-flex items-center p-1 rounded-full bg-[#f0efed] border border-[#e7e5e4]"
                              role="group"
                              aria-label={`Question ${qIndex + 1} type`}
                            >
                              <button
                                type="button"
                                onClick={() => updateQuestionField(qIndex, 'type', 'objective')}
                                className={`h-7 px-3.5 rounded-full text-[12.5px] font-medium transition-all ${isObjective
                                  ? 'bg-[#292524] text-white'
                                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
                                  }`}
                              >
                                Objective (MCQ)
                              </button>
                              <button
                                type="button"
                                onClick={() => updateQuestionField(qIndex, 'type', 'subjective')}
                                className={`h-7 px-3.5 rounded-full text-[12.5px] font-medium transition-all ${!isObjective
                                  ? 'bg-[#292524] text-white'
                                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
                                  }`}
                              >
                                Subjective
                              </button>
                            </div>
                          </div>

                          {/* Question Order & Delete Controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => moveQuestion(qIndex, -1)}
                              disabled={qIndex === 0}
                              title="Move question up"
                              aria-label={`Move question ${qIndex + 1} up`}
                              className="w-8 h-8 rounded-full border border-[#d6d3d1] bg-white hover:border-[#0c0a09] text-[#292524] flex items-center justify-center disabled:opacity-35 disabled:pointer-events-none transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(qIndex, 1)}
                              disabled={qIndex === questions.length - 1}
                              title="Move question down"
                              aria-label={`Move question ${qIndex + 1} down`}
                              className="w-8 h-8 rounded-full border border-[#d6d3d1] bg-white hover:border-[#0c0a09] text-[#292524] flex items-center justify-center disabled:opacity-35 disabled:pointer-events-none transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="h-8 px-3 rounded-full border border-[#d6d3d1] bg-white hover:border-[#dc2626] hover:text-[#dc2626] text-[#4e4e4e] text-[12.5px] font-medium transition-all"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Section Heading & Marks */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                          <div className="sm:col-span-8 flex flex-col gap-2">
                            <label
                              htmlFor={`q-heading-${qIndex}`}
                              className="text-[13.5px] font-medium text-[#292524]"
                            >
                              Section Heading
                            </label>
                            <input
                              id={`q-heading-${qIndex}`}
                              type="text"
                              value={q.heading}
                              onChange={(e) => updateQuestionField(qIndex, 'heading', e.target.value)}
                              placeholder="e.g., I. MULTIPLE CHOICE QUESTIONS"
                              className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[14.5px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {HEADING_PRESETS.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => updateQuestionField(qIndex, 'heading', preset)}
                                  className={`text-[11.5px] px-2.5 py-1 rounded-full border transition-all ${q.heading === preset
                                    ? 'bg-[#292524] text-white border-[#292524]'
                                    : 'bg-white text-[#4e4e4e] border-[#e7e5e4] hover:border-[#0c0a09]'
                                    }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="sm:col-span-4 flex flex-col gap-2">
                            <label
                              htmlFor={`q-marks-${qIndex}`}
                              className="text-[13.5px] font-medium text-[#292524]"
                            >
                              Marks
                            </label>
                            <input
                              id={`q-marks-${qIndex}`}
                              type="number"
                              min="1"
                              max="100"
                              value={q.marks}
                              onChange={(e) => updateQuestionField(qIndex, 'marks', e.target.value)}
                              className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] tabular-nums outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                              required
                            />
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {MARK_PRESETS.map((markVal) => (
                                <button
                                  key={markVal}
                                  type="button"
                                  onClick={() => updateQuestionField(qIndex, 'marks', markVal)}
                                  className={`h-7 px-2.5 rounded-full text-[12px] font-medium tabular-nums border transition-all ${Number(q.marks) === markVal
                                    ? 'bg-[#292524] text-white border-[#292524]'
                                    : 'bg-white text-[#4e4e4e] border-[#e7e5e4] hover:border-[#0c0a09]'
                                    }`}
                                >
                                  {markVal}M
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Question Text Prompt */}
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor={`q-prompt-${qIndex}`}
                            className="text-[13.5px] font-medium text-[#292524]"
                          >
                            Question Prompt
                          </label>
                          <textarea
                            id={`q-prompt-${qIndex}`}
                            rows={2}
                            value={q.question}
                            onChange={(e) => updateQuestionField(qIndex, 'question', e.target.value)}
                            placeholder={
                              isObjective
                                ? 'Enter the multiple-choice question stem...'
                                : 'Enter the subjective question prompt...'
                            }
                            className="w-full p-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all resize-y"
                            required
                          />
                          {(q.question.includes('$') || q.question.includes('\\')) && (
                            <div className="px-3.5 py-2 rounded-lg bg-white border border-[#e7e5e4] text-[14.5px] text-[#0c0a09]">
                              <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#777169] mr-2">
                                LaTeX Preview:
                              </span>
                              <LatexRenderer text={q.question} />
                            </div>
                          )}
                        </div>

                        {/* Row 4: Options Grid (Only for Objective Questions) */}
                        {isObjective && (
                          <div className="flex flex-col gap-3 pt-1">
                            <span className="text-[13.5px] font-medium text-[#292524]">
                              Multiple Choice Options (A to D)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {(q.options || []).map((opt, optIdx) => (
                                <div key={opt.label || optIdx} className="flex flex-col gap-1.5">
                                  <label
                                    htmlFor={`q-${qIndex}-opt-${optIdx}`}
                                    className="text-[12.5px] font-medium text-[#4e4e4e]"
                                  >
                                    Option {opt.label}
                                  </label>
                                  <div className="relative flex items-center">
                                    <span className="absolute left-3 w-6 h-6 rounded-full bg-[#f0efed] text-[#0c0a09] text-[12px] font-semibold flex items-center justify-center pointer-events-none">
                                      {opt.label}
                                    </span>
                                    <input
                                      id={`q-${qIndex}-opt-${optIdx}`}
                                      type="text"
                                      value={opt.text}
                                      onChange={(e) => updateOptionText(qIndex, optIdx, e.target.value)}
                                      placeholder={`Enter choice ${opt.label}...`}
                                      className="w-full h-11 pl-11 pr-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[14.5px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                                      required
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                {/* Bottom Quick-Add Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#f0efed]">
                  <span className="text-[14px] text-[#777169]">
                    Need more questions in this paper?
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => addQuestion('objective')}
                      className="h-10 px-4 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13.5px] font-medium transition-all active:scale-[0.98]"
                    >
                      + Objective
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('subjective')}
                      className="h-10 px-4 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#0c0a09] text-[#0c0a09] text-[13.5px] font-medium transition-all active:scale-[0.98]"
                    >
                      + Subjective
                    </button>
                  </div>
                </div>
              </section>
            </div>


            <aside className="lg:col-span-4 lg:sticky lg:top-22 flex flex-col gap-6">

              <div className="relative overflow-hidden bg-[#fafafa] rounded-3xl border border-[#e7e5e4] p-7 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col gap-6">
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-40 blur-2xl pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, #a7e5d3 0%, #a8c8e8 50%, transparent 75%)',
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10 pb-4 border-b border-[#e7e5e4]">
                  <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em] leading-[1.15]">
                    Paper Blueprint
                  </h2>
                  <p className="text-[14px] text-[#4e4e4e] mt-1 truncate">
                    {name.trim() || 'Untitled Assessment Paper'}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="relative z-10 grid grid-cols-2 gap-3.5">
                  <div className="bg-white rounded-xl border border-[#e7e5e4] p-4">
                    <span className="text-[11.5px] uppercase tracking-[0.08em] font-semibold text-[#777169]">
                      Questions
                    </span>
                    <p className="font-serif font-light text-3xl text-[#0c0a09] mt-1 tabular-nums">
                      {questions.length}
                    </p>
                    <p className="text-[12.5px] text-[#4e4e4e] mt-1 tabular-nums">
                      {objectiveCount} MCQ, {subjectiveCount} Subjective
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e7e5e4] p-4">
                    <span className="text-[11.5px] uppercase tracking-[0.08em] font-semibold text-[#777169]">
                      Total Marks
                    </span>
                    <p className="font-serif font-light text-3xl text-[#0c0a09] mt-1 tabular-nums">
                      {allocatedMarks}
                      <span className="text-[15px] font-sans text-[#777169]"> / {maxMarks || 0}</span>
                    </p>
                    <p className="text-[12.5px] text-[#4e4e4e] mt-1 tabular-nums">
                      {duration || 60} mins duration
                    </p>
                  </div>
                </div>

                {/* Metadata Recap */}
                <div className="relative z-10 flex flex-col gap-2.5 text-[14px] bg-white rounded-xl border border-[#e7e5e4] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777169]">Subject</span>
                    <span className="font-medium text-[#0c0a09] truncate">{subject.trim() || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777169]">Grade / Class</span>
                    <span className="font-medium text-[#0c0a09] tabular-nums">Grade {grade || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777169]">Output File</span>
                    <span className="font-medium text-[#0c0a09] truncate max-w-45">{resolvedFilename}</span>
                  </div>
                </div>

                {/* Status Feedback Banner */}
                {statusMessage.text && (
                  <div
                    className={`relative z-10 p-4 rounded-xl border text-[13.5px] leading-relaxed ${statusMessage.type === 'error'
                      ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                      : 'bg-white border-[#16a34a]/40 text-[#16a34a]'
                      }`}
                  >
                    <p className="font-medium">{statusMessage.text}</p>

                    {generatedResult?.signedUrl && (
                      <a
                        href={generatedResult.signedUrl}
                        download={generatedResult.filename || resolvedFilename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full h-10 px-4 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13.5px] font-medium inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.75"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>Download Generated PDF</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Primary Submit Button */}
                <div className="relative z-10 flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={submitting || formattingLatex}
                    className="w-full h-11 px-6 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {submitting ? (
                      <span>Formatting LaTeX & Generating...</span>
                    ) : (
                      <span>Generate Paper</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleFormatLatex}
                    disabled={submitting || formattingLatex}
                    className="w-full h-10 px-4 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[#0c0a09] text-[13.5px] font-medium transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {formattingLatex ? 'Formatting to LaTeX...' : 'Format Math to LaTeX'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowJsonPreview(!showJsonPreview)}
                    className="w-full h-10 px-4 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#0c0a09] text-[#292524] text-[13.5px] font-medium transition-all active:scale-[0.98]"
                  >
                    {showJsonPreview ? 'Hide Request JSON' : 'Inspect Request JSON'}
                  </button>
                </div>

                {/* Collapsible JSON Inspector matching reqExample.json */}
                {showJsonPreview && (
                  <div className="relative z-10 bg-white rounded-xl border border-[#e7e5e4] p-4">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f0efed]">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777169]">
                        POST /api/generate Payload
                      </span>
                    </div>
                    <pre className="text-[12px] text-[#292524] overflow-x-auto max-h-72 leading-relaxed font-mono">
                      {JSON.stringify(requestPayload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </aside>
          </form>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 2: UPLOAD EVALUATED PAPER                                          */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeView === 'upload' && (
          <section
            id="upload-paper-section"
            className="flex flex-col gap-8"
          >
            <form
              autoComplete="off"
              onSubmit={handleUploadPaperSubmit}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left 5 Columns: Evaluated Paper PDF Dropzone Card */}
              <div className="lg:col-span-5 relative overflow-hidden bg-[#fafafa] rounded-3xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-6">
                <div
                  className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-35 blur-2xl pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 55%, transparent 75%)',
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10">
                  <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em] leading-[1.2]">
                    Evaluated Script File
                  </h2>
                  <p className="text-[13.5px] text-[#777169] mt-1">
                    Attach the student&apos;s graded PDF answer sheet (.pdf).
                  </p>
                </div>

                {/* Dropzone Surface */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  aria-label="Upload evaluated student paper PDF"
                  className={`relative z-10 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 min-h-60 ${isDraggingFile
                    ? 'border-[#0c0a09] bg-white'
                    : uploadedFile
                      ? 'border-[#292524] bg-white'
                      : 'border-[#d6d3d1] bg-white/80 hover:border-[#0c0a09] hover:bg-white'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => processSelectedFile(e.target.files?.[0])}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-full bg-[#f0efed] text-[#0c0a09] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>

                  {!uploadedFile ? (
                    <>
                      <div className="flex flex-col gap-1">
                        <p className="text-[15px] font-medium text-[#0c0a09]">
                          Drop the evaluated PDF here, or <span className="underline">browse</span>
                        </p>
                        <p className="text-[13px] text-[#777169]">
                          Checked student answer script (.pdf) up to 25 MB
                        </p>
                      </div>
                      <span className="mt-1 inline-flex items-center h-9 px-4 rounded-full bg-[#f0efed] text-[#292524] text-[13px] font-medium">
                        Choose Evaluated PDF
                      </span>
                    </>
                  ) : (
                    <div
                      className="w-full flex flex-col items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f0efed] text-[#0c0a09] text-[11.5px] font-semibold uppercase tracking-[0.08em]">
                        Evaluated PDF Attached
                      </span>
                      <p className="text-[15px] font-medium text-[#0c0a09] break-all max-w-full px-2">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[13px] text-[#777169] tabular-nums">
                        {formatFileSize(uploadedFile.size)}
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-9 px-4 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[#0c0a09] text-[13px] font-medium transition-all active:scale-[0.98]"
                        >
                          Replace File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="h-9 px-4 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#dc2626] hover:text-[#dc2626] text-[#4e4e4e] text-[13px] font-medium transition-all active:scale-[0.98]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Selection Recap inside Left Card */}
                <div className="relative z-10 bg-white rounded-xl border border-[#e7e5e4] p-4 flex flex-col gap-2.5 text-[13.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777169]">Paper</span>
                    <span className="font-medium text-[#0c0a09] truncate max-w-50">
                      {selectedUploadPaper?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777169]">Student</span>
                    <span className="font-medium text-[#0c0a09] truncate">
                      {selectedUploadStudent?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777169]">Score Recorded</span>
                    <span className="font-medium text-[#0c0a09] tabular-nums">
                      {uploadMarksObtained !== '' ? uploadMarksObtained : '–'} / {selectedUploadPaper ? `${selectedUploadPaperMaxMarks} Marks` : '–'}
                      {uploadCalculatedPercentage !== null && ` (${uploadCalculatedPercentage}%)`}
                    </span>
                  </div>
                </div>

                {uploadStatus.text && (
                  <div
                    className={`relative z-10 p-4 rounded-xl border text-[13.5px] leading-relaxed ${uploadStatus.type === 'error'
                      ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                      : 'bg-white border-[#16a34a]/40 text-[#16a34a]'
                      }`}
                  >
                    <p className="font-medium">{uploadStatus.text}</p>
                  </div>
                )}
              </div>

              {/* Right 7 Columns: Choose Paper, Choose Student & Total Marks Obtained */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-6">
                <div className="flex items-center justify-between pb-5 border-b border-[#f0efed]">
                  <div>
                    <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em] leading-[1.2]">
                      Evaluation Details
                    </h2>
                    <p className="text-[14px] text-[#777169] mt-1">
                      Select the examination paper, choose the student, and record total marks obtained.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearUploadForm}
                    className="hidden sm:inline-flex items-center h-9 px-4 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#0c0a09] text-[#292524] text-[13.5px] font-medium transition-all active:scale-[0.98]"
                  >
                    Reset Form
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                  {/* 1. Choose Examination Paper */}
                  <div className="sm:col-span-12 flex flex-col gap-2">
                    <label htmlFor="upload-select-paper" className="text-[14px] font-medium text-[#292524]">
                      Examination Paper
                    </label>
                    <select
                      id="upload-select-paper"
                      value={uploadPaperId}
                      onChange={(e) => {
                        setUploadPaperId(e.target.value);
                        setUploadStatus({ type: '', text: '' });
                      }}
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    >
                      <option value="">Select Paper</option>
                      {availablePapers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.subject ? ` — ${p.subject}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Select Available Student */}
                  <div className="sm:col-span-12 flex flex-col gap-2">
                    <label htmlFor="upload-select-student" className="text-[14px] font-medium text-[#292524]">
                      Student
                    </label>
                    <select
                      id="upload-select-student"
                      value={uploadStudentId}
                      onChange={(e) => {
                        setUploadStudentId(e.target.value);
                        setUploadStatus({ type: '', text: '' });
                      }}
                      className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                      required
                    >
                      <option value="">Select Student</option>
                      {availableStudents.map((stu) => (
                        <option key={stu.id} value={stu.id}>
                          {stu.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Total Marks Obtained */}
                  <div className="sm:col-span-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="upload-marks-obtained" className="text-[14px] font-medium text-[#292524]">
                        Total Marks Obtained
                      </label>
                      <span className="text-[12.5px] text-[#777169] tabular-nums">
                        Max Marks:{' '}
                        <strong className="font-medium text-[#0c0a09]">
                          {selectedUploadPaper ? selectedUploadPaperMaxMarks : '–'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        id="upload-marks-obtained"
                        type="number"
                        step="0.5"
                        min="0"
                        max={selectedUploadPaperMaxMarks || undefined}
                        value={uploadMarksObtained}
                        onChange={(e) => setUploadMarksObtained(e.target.value)}
                        placeholder={selectedUploadPaper ? `0 – ${selectedUploadPaperMaxMarks}` : 'Enter marks'}
                        aria-invalid={Boolean(uploadMarksError)}
                        className={`w-full h-11 px-4 rounded-lg bg-white border text-[15px] text-[#0c0a09] tabular-nums outline-none focus:ring-1 transition-all ${uploadMarksError
                          ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]'
                          : 'border-[#d6d3d1] focus:border-[#0c0a09] focus:ring-[#0c0a09]'
                          }`}
                        required
                      />
                      <span className="text-[14.5px] font-medium text-[#777169] tabular-nums shrink-0">
                        / {selectedUploadPaper ? selectedUploadPaperMaxMarks : '–'}
                      </span>
                    </div>
                    {uploadMarksError ? (
                      <p className="text-[12.5px] text-[#dc2626]">{uploadMarksError}</p>
                    ) : (
                      <p className="text-[12.5px] text-[#777169]">
                        Enter the final marks scored by the student on this paper.
                      </p>
                    )}
                  </div>

                  {/* Computed Percentage Display Box */}
                  <div className="sm:col-span-6 flex flex-col justify-between rounded-xl bg-[#fafafa] border border-[#e7e5e4] p-4">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777169]">
                      Computed Score
                    </span>
                    <div className="my-1 flex items-baseline gap-2">
                      <span className="font-serif font-light text-3xl text-[#0c0a09] tabular-nums">
                        {uploadCalculatedPercentage !== null ? `${uploadCalculatedPercentage}%` : '—'}
                      </span>
                      <span className="text-[13px] text-[#777169] tabular-nums">
                        ({uploadMarksObtained !== '' ? uploadMarksObtained : 0} of {selectedUploadPaperMaxMarks} marks)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f0efed] flex flex-wrap items-center justify-between gap-4">
                  <span className="text-[13.5px] text-[#777169]">
                    {uploadedFile
                      ? `Attached: ${uploadedFile.name}`
                      : 'Attach the evaluated PDF script on the left to submit.'}
                  </span>
                  <button
                    type="submit"
                    disabled={uploadingPaper}
                    className="h-11 px-6 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {uploadingPaper ? 'Uploading...' : 'Upload Evaluated Paper'}
                  </button>
                </div>
              </div>
            </form>

            {/* Uploaded Evaluated Papers Log */}
            <div className="bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#f0efed]">
                <div>
                  <h3 className="font-serif font-light text-2xl text-[#0c0a09] tracking-[-0.02em]">
                    Evaluated Papers ({displayedEvaluatedPapers.length})
                  </h3>
                  <p className="text-[13.5px] text-[#777169] mt-0.5">
                    Graded answer scripts stored in the database.
                  </p>
                </div>
              </div>

              {displayedEvaluatedPapers.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[14px] text-[#777169]">No evaluated papers uploaded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f0efed]">
                  {displayedEvaluatedPapers.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[15px] font-medium text-[#0c0a09]">
                            {item.paperName}
                          </span>
                          {item.subject && (
                            <span className="text-[13px] text-[#777169]">· {item.subject}</span>
                          )}
                        </div>
                        <p className="text-[13px] text-[#777169]">
                          Student ID:{' '}
                          <span className="text-[#292524] font-medium tabular-nums">
                            {item.studentId ?? '—'}
                          </span>
                          {item.studentName && (
                            <span className="text-[#777169]"> ({item.studentName})</span>
                          )}
                          {item.uploadedAt && (
                            <span className="text-[#777169]"> · {item.uploadedAt}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="font-serif font-light text-2xl text-[#0c0a09] tabular-nums">
                            {item.marksObtained}
                          </span>
                          <span className="text-[13.5px] text-[#777169] tabular-nums">
                            /{item.maxMarks} ({item.percentage}%)
                          </span>
                        </div>
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="h-9 px-4 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] hover:bg-[#292524] text-[#0c0a09] hover:text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition-all active:scale-[0.98]"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
