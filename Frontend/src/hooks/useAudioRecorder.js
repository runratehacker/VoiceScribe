// Contains the boiler plate code for audio recording

import { useState, useRef, useCallback, useEffect } from 'react';
import { downsampleTo16k, floatTo16BitPCM, int16ToBase64 } from '../utils/audioUtils';

export const useAudioRecorder = ({ onAudioData }) => {
  // isRecording is a boolean that indicates whether the 
  // user is currently recording audio // intially false
  const [isRecording, setIsRecording] = useState(false);
  // waveHeights is an array that stores the height of the waveform
  // all elements are initialized to 2
  const [waveHeights, setWaveHeights] = useState(Array(50).fill(2));

  // Audio recording variables

  const streamRef = useRef(null);
  // streamref // physical microphone // holds the actual raw connection  
  const audioContextRef = useRef(null);
  // holds the audio context // req for the WebAudio API
   const sourceRef = useRef(null);
   // acts as a cable // connects the phsical microphone to the audio context
  const analyserRef = useRef(null);
  // inbuilt feature of the WebAudio API // to analyse the audio
  // used to create the waveform animation
  const zeroGainRef = useRef(null);
  // to stop the echo of our own voice
  const animationRef = useRef(null);
  // used to stop the waveform animation
 
  
  const processorRef = useRef(null);
  
 // Two functions defined to start and stop recording

 // Boilerplate code to start recording

 // startRecording() function 

 // Overview of the code 
 // 1. permission from the user to use the microphone
 // 2. does all the standard procedure 
 // 3. takes up the raw audio from user and sends to Gemini in chunks
 // 4. logic for the waveform animation is defined

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.fftSize = 128; 

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      zeroGainRef.current = audioContextRef.current.createGain();
      zeroGainRef.current.gain.value = 0;

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(zeroGainRef.current);
      zeroGainRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const downsampled = downsampleTo16k(input, audioContextRef.current.sampleRate);
        const pcm16 = floatTo16BitPCM(downsampled);
        const b64 = int16ToBase64(pcm16);

        if (onAudioData) {
          onAudioData(b64);
        }
      };

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        analyserRef.current.getByteFrequencyData(dataArray);

        const newHeights = Array(50).fill(0).map((_, i) => {
          const dataIndex = Math.floor(i * (bufferLength / 50));
          const audioValue = dataArray[dataIndex];
          return Math.max(2, (audioValue / 255) * 100);
        });

        const curvedHeights = newHeights.map((height, i) => {
            const center = 25;
            const distance = Math.abs(i - center);
            const multiplier = Math.max(0.3, 1 - (distance * 0.03));
            return height * multiplier;
        });

        setWaveHeights(curvedHeights);
        animationRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
      setIsRecording(true);
      
    } catch (err) {
      console.error("Microphone access denied or error occurred:", err);
      alert("Please allow microphone access to see the waveform animation.");
    }
  }, [onAudioData]);

  // after all the standard procedure is done setRecording is set to true

  // Boilerplate code to stop recording

  // stopRecording() function

  // Overview of the code 
  // 1. stops sending the audio to Gemini
  // 2. stops the waveform animation
  // 3. stops the whole connection process
  

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (zeroGainRef.current) {
      try { zeroGainRef.current.disconnect(); } catch {}
      zeroGainRef.current = null;
    }

    setIsRecording(false);
    setWaveHeights(Array(50).fill(2));

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return { startRecording, stopRecording, isRecording, waveHeights };
  // exporting these functions 
};
