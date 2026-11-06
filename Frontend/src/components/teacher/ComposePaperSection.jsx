import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LatexRenderer from '../LatexRenderer';

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

const ComposePaperSection = ({ onPaperCreated }) => {
  const [name, setName] = useState(SAMPLE_PAPER.name);
  const [subject, setSubject] = useState(SAMPLE_PAPER.subject);
  const [description, setDescription] = useState(SAMPLE_PAPER.description);
  const [grade, setGrade] = useState(5);
  const [duration, setDuration] = useState(60);
  const [maxMarks, setMaxMarks] = useState(50);
  const [customFilename, setCustomFilename] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const dateRangeError = useMemo(() => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return 'End date must be on or after the start date.';
    }
    return '';
  }, [startDate, endDate]);

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

  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [formattingLatex, setFormattingLatex] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [generatedResult, setGeneratedResult] = useState(null);

  const resolvedFilename = useMemo(() => {
    const raw = customFilename.trim()
      ? customFilename.trim()
      : name.trim()
        ? `${name.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
        : 'Assessment_Paper.pdf';
    return raw.endsWith('.pdf') ? raw : `${raw}.pdf`;
  }, [customFilename, name]);

  const allocatedMarks = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    [questions]
  );

  const objectiveCount = useMemo(
    () => questions.filter((q) => q.type === 'objective').length,
    [questions]
  );

  const subjectiveCount = questions.length - objectiveCount;

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

      const response = await axios.post(`${API_BASE_URL}/api/generate`, finalPayload);
      setGeneratedResult(response.data);
      setStatusMessage({
        type: 'success',
        text: response.data?.message || 'Paper formatted to LaTeX and PDF saved to storage.',
      });

      if (onPaperCreated) {
        onPaperCreated(response.data?.paperId, finalPayload);
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

  return (
    <form autoComplete="off" onSubmit={handleGeneratePaper} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Paper Details Card */}
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

            {/* Description / Institution */}
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

            {/* Grade / Class */}
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
                className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                required
              />
            </div>

            {/* Duration */}
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
                className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                required
              />
            </div>

            {/* Max Marks */}
            <div className="sm:col-span-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="paper-max-marks" className="text-[14px] font-medium text-[#292524]">
                  Maximum Marks
                </label>
                <span
                  className={`text-[12px] tabular-nums ${allocatedMarks === Number(maxMarks)
                    ? 'text-[#16a34a]'
                    : allocatedMarks > Number(maxMarks)
                      ? 'text-[#dc2626]'
                      : 'text-[#777169]'
                    }`}
                >
                  Allocated: {allocatedMarks}
                </span>
              </div>
              <input
                id="paper-max-marks"
                type="number"
                min="1"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                required
              />
            </div>

            {/* Start Date */}
            <div className="sm:col-span-6 flex flex-col gap-2">
              <label htmlFor="paper-start-date" className="text-[14px] font-medium text-[#292524]">
                Start Date
              </label>
              <input
                id="paper-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                required
              />
            </div>

            {/* End Date */}
            <div className="sm:col-span-6 flex flex-col gap-2">
              <label htmlFor="paper-end-date" className="text-[14px] font-medium text-[#292524]">
                End Date
              </label>
              <input
                id="paper-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                required
              />
            </div>
            {dateRangeError && (
              <div className="sm:col-span-12 -mt-2">
                <span className="text-[12.5px] text-[#dc2626] font-medium">
                  {dateRangeError}
                </span>
              </div>
            )}

            {/* Filename Override */}
            <div className="sm:col-span-12 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="paper-filename" className="text-[14px] font-medium text-[#292524]">
                  PDF Filename
                </label>
                <span className="text-[12px] text-[#777169] font-mono">
                  resolved: {resolvedFilename}
                </span>
              </div>
              <input
                id="paper-filename"
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Leave blank to auto-generate from title (e.g. Science_Annual_Exam.pdf)"
                className="w-full h-11 px-4 rounded-lg bg-white border border-[#d6d3d1] text-[13.5px] text-[#0c0a09] placeholder-[#777169]/70 outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] font-mono transition-all"
              />
            </div>
          </div>
        </section>

        {/* Questions Studio */}
        <section className="bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#f0efed]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em] leading-[1.2]">
                  Questions Studio
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09] text-[12px] font-semibold tabular-nums">
                  {questions.length} {questions.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-[14px] text-[#777169] mt-1">
                Enter your questions, select MCQ or subjective, and write formulas in standard text or LaTeX.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addQuestion('objective')}
                className="h-9 px-4 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13px] font-medium transition-all active:scale-[0.98] inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>+ Add MCQ</span>
              </button>
              <button
                type="button"
                onClick={() => addQuestion('subjective')}
                className="h-9 px-4 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[#0c0a09] text-[13px] font-medium transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
              >
                <span>+ Add Subjective</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="group relative rounded-2xl border border-[#e7e5e4] p-5 sm:p-6 bg-[#fafafa] hover:bg-white hover:border-[#d6d3d1] transition-all"
              >
                <div className="flex flex-col gap-4">
                  {/* Item Header Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f0efed]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#0c0a09] text-white text-[13px] font-medium flex items-center justify-center tabular-nums">
                        {qIndex + 1}
                      </span>

                      {/* Type Toggle Pill */}
                      <div className="flex items-center bg-white border border-[#d6d3d1] rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuestionField(qIndex, 'type', 'objective')}
                          className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${q.type === 'objective'
                            ? 'bg-[#292524] text-white'
                            : 'text-[#777169] hover:text-[#0c0a09]'
                            }`}
                        >
                          Objective (MCQ)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQuestionField(qIndex, 'type', 'subjective')}
                          className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${q.type === 'subjective'
                            ? 'bg-[#292524] text-white'
                            : 'text-[#777169] hover:text-[#0c0a09]'
                            }`}
                        >
                          Subjective
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, -1)}
                        disabled={qIndex === 0}
                        aria-label="Move question up"
                        className="w-8 h-8 rounded-full border border-[#d6d3d1] hover:border-[#0c0a09] bg-white text-[#777169] hover:text-[#0c0a09] flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-[0.96]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 1)}
                        disabled={qIndex === questions.length - 1}
                        aria-label="Move question down"
                        className="w-8 h-8 rounded-full border border-[#d6d3d1] hover:border-[#0c0a09] bg-white text-[#777169] hover:text-[#0c0a09] flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-[0.96]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={questions.length <= 1}
                        aria-label="Delete question"
                        className="w-8 h-8 rounded-full border border-[#d6d3d1] hover:border-[#dc2626] bg-white text-[#777169] hover:text-[#dc2626] flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-[0.96]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Section Heading & Marks Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`q-heading-${qIndex}`}
                          className="text-[13.5px] font-medium text-[#292524]"
                        >
                          Section Heading
                        </label>
                        <div className="flex items-center gap-1">
                          {HEADING_PRESETS.slice(0, 2).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => updateQuestionField(qIndex, 'heading', preset)}
                              className="text-[11px] text-[#777169] hover:text-[#0c0a09] underline truncate max-w-28"
                            >
                              {preset.replace(/^([IVXLCDM]+\.\s*)/, '')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        id={`q-heading-${qIndex}`}
                        type="text"
                        value={q.heading}
                        onChange={(e) => updateQuestionField(qIndex, 'heading', e.target.value)}
                        placeholder="e.g., I. MULTIPLE CHOICE QUESTIONS"
                        className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[14px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                        required
                      />
                    </div>

                    <div className="sm:col-span-4 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`q-marks-${qIndex}`}
                          className="text-[13.5px] font-medium text-[#292524]"
                        >
                          Marks
                        </label>
                        <div className="flex items-center gap-1">
                          {MARK_PRESETS.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => updateQuestionField(qIndex, 'marks', m)}
                              className={`text-[11px] px-1.5 py-0.5 rounded ${Number(q.marks) === m
                                ? 'bg-[#292524] text-white font-semibold'
                                : 'text-[#777169] hover:text-[#0c0a09]'
                                }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        id={`q-marks-${qIndex}`}
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={q.marks}
                        onChange={(e) => updateQuestionField(qIndex, 'marks', e.target.value)}
                        className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[14px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`q-prompt-${qIndex}`}
                      className="text-[13.5px] font-medium text-[#292524]"
                    >
                      Question Prompt
                    </label>
                    <textarea
                      id={`q-prompt-${qIndex}`}
                      rows={3}
                      value={q.question}
                      onChange={(e) => updateQuestionField(qIndex, 'question', e.target.value)}
                      placeholder="Type question prompt here. You can use standard text or LaTeX formulas like $x^2 + y^2 = r^2$."
                      className="w-full p-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[14.5px] text-[#0c0a09] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all resize-y leading-relaxed"
                      required
                    />

                    {/* Live LaTeX Math Preview if dollar signs are detected */}
                    {q.question.includes('$') && (
                      <div className="mt-1 p-3 rounded-lg bg-white border border-[#e7e5e4] text-[14px]">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#777169] block mb-1">
                          LaTeX Render Preview:
                        </span>
                        <LatexRenderer text={q.question} className="text-[#0c0a09]" />
                      </div>
                    )}
                  </div>

                  {/* Objective Options Grid (only for MCQ) */}
                  {q.type === 'objective' && (
                    <div className="flex flex-col gap-2.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-[#4e4e4e]">
                          Multiple Choice Options (A, B, C, D)
                        </span>
                        <span className="text-[12px] text-[#777169]">
                          Supports LaTeX like $v = u + at$
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(q.options || []).map((opt, optIdx) => {
                          const optionLabel = opt.label || String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2 bg-white rounded-lg border border-[#d6d3d1] px-3 focus-within:border-[#0c0a09] focus-within:ring-1 focus-within:ring-[#0c0a09] transition-all"
                            >
                              <span className="text-[13px] font-bold text-[#0c0a09] w-4 shrink-0">
                                {optionLabel}.
                              </span>
                              <input
                                id={`q-${qIndex}-opt-${optIdx}`}
                                type="text"
                                value={opt.text || ''}
                                onChange={(e) => updateOptionText(qIndex, optIdx, e.target.value)}
                                placeholder={`Option ${optionLabel}`}
                                className="w-full h-10 py-2 bg-transparent text-[14px] text-[#0c0a09] outline-none placeholder-[#777169]/70"
                                required
                              />
                              {opt.text && opt.text.includes('$') && (
                                <div className="shrink-0 max-w-32 truncate text-[12px] text-[#4e4e4e] border-l pl-2 border-[#f0efed]">
                                  <LatexRenderer text={opt.text} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Add Question Bar */}
          <div className="pt-6 mt-6 border-t border-[#f0efed] flex flex-wrap items-center justify-between gap-4">
            <span className="text-[13.5px] text-[#777169]">
              Total Allocated: <strong className="text-[#0c0a09] font-medium">{allocatedMarks} marks</strong> across{' '}
              {questions.length} questions.
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => addQuestion('objective')}
                className="h-10 px-4 rounded-full bg-[#f0efed] hover:bg-[#e7e5e4] text-[#0c0a09] text-[13.5px] font-medium transition-all active:scale-[0.98]"
              >
                + Add Objective Question
              </button>
              <button
                type="button"
                onClick={() => addQuestion('subjective')}
                className="h-10 px-4 rounded-full bg-[#f0efed] hover:bg-[#e7e5e4] text-[#0c0a09] text-[13.5px] font-medium transition-all active:scale-[0.98]"
              >
                + Add Subjective Question
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Right 4 Columns: Sticky Summary & Action Palette */}
      <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-6">
        <div className="relative overflow-hidden bg-[#fafafa] rounded-3xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-6">
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-35 blur-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 55%, transparent 75%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[#f0efed]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777169]">
              Allocation Summary
            </span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-[12.5px] text-[#0c0a09] hover:underline font-medium"
            >
              Load Sample Paper
            </button>
          </div>

          <div className="relative z-10">
            <span className="text-[12px] uppercase tracking-wider text-[#777169] font-semibold">
              Paper Overview
            </span>
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
  );
};

export default ComposePaperSection;

