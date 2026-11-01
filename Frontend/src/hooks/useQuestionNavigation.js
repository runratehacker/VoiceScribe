import { useState } from 'react';

export const useQuestionNavigation = (formFields) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Grab only the actual questions, ignoring settings and headers
  const questionKeys = Object.keys(formFields || {}).filter(
    (key) => key !== 'Instruction' && key !== 'headings'
  );
  const totalQuestions = questionKeys.length;
  const currentKey = questionKeys[currentQuestionIndex];
  const currentField = currentKey ? formFields[currentKey] : null;
  const questionNumber = currentField?.question_number ?? currentQuestionIndex + 1;

  const currentHeading = currentField?.heading || '';

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleGoToQuestion = (label) => {
    const labelLower = String(label || '').toLowerCase().trim();
    if (!labelLower) return;

    const index = questionKeys.findIndex((key) => {
      const field = formFields[key];
      if (!field) return false;

      const fieldLabelLower = String(field.label || '').toLowerCase().trim();
      const qNumStr =
        field.question_number !== undefined ? String(field.question_number).toLowerCase().trim() : '';
      const keyLower = key.toLowerCase().trim();

      return (
        fieldLabelLower === labelLower ||
        qNumStr === labelLower ||
        keyLower === labelLower ||
        labelLower === `question ${qNumStr}` ||
        labelLower === `q${qNumStr}` ||
        (fieldLabelLower && labelLower.includes(fieldLabelLower)) ||
        (fieldLabelLower && fieldLabelLower.includes(labelLower))
      );
    });

    if (index !== -1) {
      setCurrentQuestionIndex(index);
    }
  };

  const isCompleted = totalQuestions > 0 && currentQuestionIndex === totalQuestions;

  return {
    currentQuestionIndex,
    totalQuestions,
    currentKey,
    currentField,
    questionNumber,
    currentHeading,
    handleNext,
    handlePrev,
    handleGoToQuestion,
    isCompleted
  };
};
