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
  // const [isMicActive, setIsMicActive] = useState(false);

  // Should get onFieldFilled and formFields from useGeminiForm
  // TODO: Add useGeminiForm hook here
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

  // Copied part 
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
      
      // End the websocket connection after giving Gemini enough time to say goodbye.
      const timer = setTimeout(() => {
        if (isRecording) {
          isIntentionalDisconnectRef.current = true;
          stopRecording();
          disconnect();
          stopPlayback();
        }
      }, 10000); // 10 seconds should be enough for a brief goodbye

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

  // Handle reconnection states — the hook now auto-reconnects internally
  // This effect only handles the final failure case or intentional disconnect
  useEffect(() => {
    if (wsState === 'error' && isRecording) {
      // Hook exhausted all retries — stop recording so user can re-click mic
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

  // When the user clicks on the Mic button
  const toggleMicrophone = async () => {
    if (isRecording) {
      isIntentionalDisconnectRef.current = true; // Mark as intentional
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
    <div className="h-screen w-full overflow-hidden bg-[#F3F4F8] p-4 md:p-6 flex flex-col font-sans text-slate-800">

      <Header 
        progressTotal={progressTotal} 
        progressCompleted={progressCompleted} 
        progressPending={progressPending} 
      />

      {/* Render only the CURRENT question */}
      {!isCompleted && !currentField && (
        <div className="flex-1 bg-[#FDFDFD] rounded-4xl shadow-sm border border-slate-200 flex flex-col p-6 md:p-8 items-center justify-center mb-4 min-h-30">
          <p className="text-slate-500 font-medium">Loading questions or form not found...</p>
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

      {/* {!isCompleted && currentField && currentField.type !== "objective" && currentField.type !== "subjective" && currentField.type !== "text" && (
        <div className="flex-1 bg-[#FDFDFD] rounded-4xl shadow-sm border border-slate-200 flex flex-col p-6 md:p-8 items-center justify-center mb-4 min-h-30">
          <p className="text-red-500 font-medium">Error: Unsupported question type '{currentField.type}'</p>
        </div>
      )} */}

      {isCompleted && (
        <ExamCompletedScreen onPrev={handlePrev} onDownload={handleDownload} />
      )}

      <VoiceFooter isRecording={isRecording} toggleMicrophone={toggleMicrophone} />
    </div>
  );
};

export default VoiceAssistantUI;