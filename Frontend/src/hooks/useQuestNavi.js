import { useState } from 'react';

export const useQuestNavi = (formFields = {}) => {

  const [currQuestIndex, setCurrQuestIndex] = useState(0);

  const questionKeys = Object.keys(formFields);
  const totalQuestions = questionKeys.length;

  const currentKey = questionKeys[currQuestIndex];
  const currentField = currentKey ? formFields[currentKey] : null;

  const questionNumber = currentField?.question_number ?? currQuestIndex + 1;

  const currentHeading = currentField?.heading || '';

  const handleNext = () => {

    if (currQuestIndex < totalQuestions) {
      setCurrQuestIndex((prev) => prev + 1);
    }

  };

  const handlePrev = () => {

    if (currQuestIndex > 0) {
      setCurrQuestIndex((prev) => prev - 1);
    }

  };

  const handleGoToQuestion = (key) => {

    const index = questionKeys.indexOf(key);

    if (index !== -1) {
      setCurrQuestIndex(index);
    }

  };

  const isCompleted = totalQuestions > 0 && currQuestIndex === totalQuestions;

  const handleEndExam = () => {

    if (totalQuestions > 0) {
      setCurrQuestIndex(totalQuestions);
    }

  };

  return {
    currQuestIndex,
    totalQuestions,
    currentKey,
    currentField,
    questionNumber,
    currentHeading,
    handleNext,
    handlePrev,
    handleGoToQuestion,
    handleEndExam,
    isCompleted
  };
};

