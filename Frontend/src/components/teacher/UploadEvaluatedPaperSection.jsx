import React, { useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const UploadEvaluatedPaperSection = ({ availablePapers = [], availableStudents = [] }) => {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadPaperId, setUploadPaperId] = useState('');
  const [uploadStudentId, setUploadStudentId] = useState('');
  const [uploadMarksObtained, setUploadMarksObtained] = useState('');
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', text: '' });
  const [uploadedEvaluatedList, setUploadedEvaluatedList] = useState([]);

  const selectedUploadPaper = useMemo(
    () => availablePapers.find((p) => String(p.id) === String(uploadPaperId)) || null,
    [availablePapers, uploadPaperId]
  );

  const selectedUploadPaperMaxMarks = useMemo(
    () => (selectedUploadPaper ? Number(selectedUploadPaper.max_marks) || 50 : 0),
    [selectedUploadPaper]
  );

  const selectedUploadStudent = useMemo(
    () => availableStudents.find((s) => String(s.id) === String(uploadStudentId)) || null,
    [availableStudents, uploadStudentId]
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
      formData.append('student_id', 1); // Fixed to 1 as requested
      formData.append('teacher_id', 1); // Fixed to 1 as requested
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
        studentId: selectedUploadStudent?.id || 1,
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
    <section id="upload-paper-section" className="flex flex-col gap-8">
      <form autoComplete="off" onSubmit={handleUploadPaperSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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

        {/* Right 7 Columns: Selection Form Controls */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0efed]">
            <div>
              <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em] leading-[1.2]">
                Record Evaluation
              </h2>
              <p className="text-[14px] text-[#777169] mt-1">
                Assign the checked PDF to the appropriate examination paper and student.
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
                Paper
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
      {uploadedEvaluatedList.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0efed]">
            <div>
              <h3 className="font-serif font-light text-2xl text-[#0c0a09] tracking-[-0.02em]">
                Uploaded Evaluated Papers ({uploadedEvaluatedList.length})
              </h3>
              <p className="text-[13.5px] text-[#777169] mt-0.5">
                Graded scripts recorded during this session.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#f0efed]">
            {uploadedEvaluatedList.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-medium text-[#0c0a09]">
                      {item.studentName}
                    </span>
                    <span className="text-[13px] text-[#777169]">· {item.paperName}</span>
                  </div>
                  <p className="text-[13px] text-[#777169]">
                    File: <span className="text-[#292524] font-medium">{item.fileName}</span>
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
                      className="h-9 px-4 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[#0c0a09] text-[13px] font-medium inline-flex items-center transition-all active:scale-[0.98]"
                    >
                      View PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default UploadEvaluatedPaperSection;

