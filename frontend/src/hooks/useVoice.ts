import { useState, useRef, useCallback } from 'react';
import { VoiceState } from '@/types';

export const useVoice = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isPlaying: false,
    isMuted: false,
    voiceEnabled: false,
    transcription: '',
    isTranscribing: false,
    audioBlob: null,
    recordingDuration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceState(prev => ({ ...prev, audioBlob: blob }));
        transcribeAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setVoiceState(prev => ({ ...prev, isRecording: true, recordingDuration: 0 }));
      
      recordingTimerRef.current = setInterval(() => {
        setVoiceState(prev => ({ ...prev, recordingDuration: prev.recordingDuration + 1 }));
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
      setVoiceState(prev => ({ ...prev, isRecording: false }));
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [voiceState.isRecording]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setVoiceState(prev => ({ ...prev, isTranscribing: true }));
    
    // Mock transcription - replace with actual API call
    setTimeout(() => {
      const mockTranscriptions = [
        "Is it alive?",
        "Is it bigger than a car?",
        "Is it man-made?",
        "Can you eat it?",
        "Is it found in nature?",
        "Does it move on its own?",
        "Is it electronic?",
        "Yes, that's correct!",
        "No, try again.",
        "I think it's a building!"
      ];
      const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      setVoiceState(prev => ({ 
        ...prev, 
        transcription: randomTranscription, 
        isTranscribing: false 
      }));
    }, 2000);
  }, []);

  const playAudio = useCallback(() => {
    if (voiceState.audioBlob && !voiceState.isPlaying && audioRef.current) {
      const url = URL.createObjectURL(voiceState.audioBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setVoiceState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [voiceState.audioBlob, voiceState.isPlaying]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setVoiceState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const toggleVoiceEnabled = useCallback(() => {
    setVoiceState(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  }, []);

  const clearTranscription = useCallback(() => {
    setVoiceState(prev => ({ ...prev, transcription: '', audioBlob: null }));
  }, []);

  return {
    voiceState,
    audioRef,
    startRecording,
    stopRecording,
    playAudio,
    pauseAudio,
    toggleVoiceEnabled,
    clearTranscription,
  };
};