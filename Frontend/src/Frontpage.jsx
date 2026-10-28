import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import VoiceFooter from './components/VoiceFooter';
import Objective from './components/Objective';
import Subjective from './components/Subjective';
import ExamCompletedScreen from './components/ExamCompletedScreen';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useGeminiLive } from './hooks/useGeminiLive';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useFormFields } from './hooks/useFormFields';
import { useQuestionNavigation } from './hooks/useQuestionNavigation';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';


const VoiceAssistantUI = () => {
  const { formid } = useParams();
  const { formFields, onFieldFilled, onFieldReset } = useFormFields(formid);

  useEffect(() => {
    if (formid) {
      localStorage.setItem('lastActiveFormId', formid);
    }
  }, [formid]);

  const {
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
  } = useQuestionNavigation(formFields);

  const messagesEndRef = useRef(null);
  const { enqueueAudio, stopPlayback } = useAudioPlayback();

  const { messages, wsState, connect, disconnect, sendAudioChunk, sendCompletionMessage } = useGeminiLive({
    onFieldFilled,
    onFieldReset,
    onAudioReceived: enqueueAudio,
    formFields,
    currentKey,
    onNextQuestion: handleNext,
    onPrevQuestion: handlePrev,
    onGoToQuestion: handleGoToQuestion
  });
  const { isRecording, waveHeights, startRecording, stopRecording } = useAudioRecorder({
    onAudioData: sendAudioChunk
  });

  const keys = Object.keys(formFields || {}).filter(k => formFields[k]?.label);
  const progressTotal = keys.length;
  const progressCompleted = keys.filter(k => formFields[k].filled).length;
  const progressPending = progressTotal - progressCompleted;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const completionMessageSentRef = useRef(false);

  useEffect(() => {
    if (isCompleted && !completionMessageSentRef.current && wsState === "ready") {
      completionMessageSentRef.current = true;
      sendCompletionMessage();

      const timer = setTimeout(() => {
        if (isRecording) {
          isIntentionalDisconnectRef.current = true;
          stopRecording();
          disconnect();
          stopPlayback();
        }
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, wsState, isRecording, sendCompletionMessage, stopRecording, disconnect, stopPlayback]);

  const handleDownload = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/download/${formid}`, {
        formFields
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'filled_worksheet.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF.");
    }
  };

  const isIntentionalDisconnectRef = useRef(false);
  const hasAutoConnected = useRef(false);

  // Auto-connect on page load
  useEffect(() => {
    const hasQuestionsLoaded = formFields && Object.keys(formFields).length > 0;

    if (hasQuestionsLoaded && !hasAutoConnected.current) {
      hasAutoConnected.current = true;
      const initVoice = async () => {
        try {
          await connect();
          await startRecording();
        } catch (e) {
          console.error("Auto-connect on load failed", e);
        }
      };
      initVoice();
    }
  }, [connect, startRecording, formFields]);

  useEffect(() => {
    if (wsState === 'error' && isRecording) {
      console.log("Reconnection failed after all retries. Stopping recording.");
      stopRecording();
      stopPlayback();
    }

    if (wsState === 'idle' && isRecording) {
      if (isIntentionalDisconnectRef.current) {
        stopRecording();
        stopPlayback();
        isIntentionalDisconnectRef.current = false;
      }
    }
  }, [wsState, isRecording, stopRecording, stopPlayback]);

  const toggleMicrophone = async () => {
    if (isRecording) {
      isIntentionalDisconnectRef.current = true;
      stopRecording();
      disconnect();
      stopPlayback();
    } else {
      isIntentionalDisconnectRef.current = false;
      try {
        await connect();
        await startRecording();
      } catch (e) {
        console.error("Failed to start voice interface", e);
      }
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#f5f5f5] text-[#292524] p-4 sm:p-6 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-[#292524] selection:text-white">

      {/* Atmospheric Pastel Gradient Orbs (ElevenLabs signature) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-28 right-1/4 w-145 h-145 rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)'
          }}
        />
        <div
          className="absolute bottom-10 -left-24 w-130 h-130 rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 45%, transparent 75%)'
          }}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0 relative z-10">
        <Header
          progressTotal={progressTotal}
          progressCompleted={progressCompleted}
          progressPending={progressPending}
          currentQuestionIndex={currentQuestionIndex}
          onGoToQuestion={handleGoToQuestion}
        />

        {/* Skeletal Loaders Matching Question Studio Split Layout */}
        {!isCompleted && !currentField && (
          <div className="flex-1 w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-4 min-h-0 items-stretch animate-pulse">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e7e5e4] p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-[#f0efed] mb-8">
                  <div className="h-6 w-36 bg-[#f0efed] rounded-full" />
                  <div className="h-6 w-20 bg-[#f0efed] rounded-full" />
                </div>
                <div className="h-4 w-28 bg-[#f0efed] rounded-md mb-4" />
                <div className="space-y-3">
                  <div className="h-8 w-5/6 bg-[#f0efed] rounded-lg" />
                  <div className="h-8 w-2/3 bg-[#f0efed] rounded-lg" />
                </div>
              </div>
              <div className="pt-5 border-t border-[#f0efed] flex justify-between">
                <div className="h-4 w-48 bg-[#f0efed] rounded-md" />
                <div className="h-4 w-24 bg-[#f0efed] rounded-md" />
              </div>
            </div>
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-8 flex flex-col justify-between gap-4">
              <div className="h-6 w-32 bg-[#f0efed] rounded-md mb-2" />
              <div className="flex-1 flex flex-col gap-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-14 w-full bg-[#fafafa] border border-[#e7e5e4] rounded-xl" />
                ))}
              </div>
              <div className="h-4 w-full bg-[#f0efed] rounded-md" />
            </div>
          </div>
        )}

        {!isCompleted && currentField && currentField.type === "objective" && (
          <Objective
            key={currentKey}
            fieldKey={questionNumber}
            label={currentField.label}
            heading={currentHeading}
            question={currentField.question}
            value={currentField.value}
            filled={currentField.filled}
            options={currentField.options}
            totalQuestions={totalQuestions}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={currentQuestionIndex > 0}
            hasNext={currentQuestionIndex < totalQuestions}
            onSelectOption={(optionLabel) => onFieldFilled(currentKey, optionLabel, true)}
          />
        )}

        {!isCompleted && currentField && (currentField.type === "subjective" || currentField.type === "text") && (
          <Subjective
            key={currentKey}
            fieldKey={questionNumber}
            label={currentField.label}
            heading={currentHeading}
            question={currentField.question}
            value={currentField.value}
            filled={currentField.filled}
            totalQuestions={totalQuestions}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={currentQuestionIndex > 0}
            hasNext={currentQuestionIndex < totalQuestions}
          />
        )}

        {isCompleted && (
          <ExamCompletedScreen
            onPrev={handlePrev}
            onDownload={handleDownload}
            progressTotal={progressTotal}
            progressCompleted={progressCompleted}
          />
        )}

        <VoiceFooter
          isRecording={isRecording}
          toggleMicrophone={toggleMicrophone}
          onPrev={!isCompleted ? handlePrev : null}
          onNext={!isCompleted ? handleNext : null}
          hasPrev={currentQuestionIndex > 0}
          hasNext={currentQuestionIndex < totalQuestions - 1}
        />
      </div>
    </div>
  );
};

export default VoiceAssistantUI;
