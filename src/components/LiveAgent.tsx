import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, X, Volume2, Loader2, AlertCircle } from 'lucide-react';

interface LiveAgentProps {
  onClose: () => void;
}

export const LiveAgent: React.FC<LiveAgentProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); // To store the session object

  useEffect(() => {
    let mounted = true;

const startSession = async () => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    if (!apiKey) {
      throw new Error("API Key missing. Please set VITE_GEMINI_API_KEY in your .env file.");
    }

    const ai = new GoogleGenAI({ apiKey });
        
        // Setup Audio Contexts
        inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const outputNode = outputContextRef.current.createGain();
        outputNode.connect(outputContextRef.current.destination);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Connect to Live API
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              setStatus('listening');

              // Setup Input Processing
              if (!inputContextRef.current) return;
              const source = inputContextRef.current.createMediaStreamSource(stream);
              const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                if (!mounted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputContextRef.current.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (!mounted) return;
              
              const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && outputContextRef.current) {
                setStatus('speaking');
                
                // Decode and Play
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
                
                const audioBuffer = await decodeAudioData(
                  decodeBase64(base64Audio),
                  outputContextRef.current,
                  24000,
                  1
                );

                const source = outputContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) {
                     setStatus('listening');
                  }
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setStatus('listening');
              }
            },
            onerror: (err: any) => {
              console.error("Live API Error:", err);
              if (mounted) {
                setStatus('error');
                // Detect specific 403 error for better feedback
                if (err.toString().includes('403') || (err.message && err.message.includes('403'))) {
                   setErrorMessage('Access Denied: Enable API');
                } else {
                   setErrorMessage('Connection failed');
                }
              }
            },
            onclose: () => {
              console.log("Live API Closed");
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } // Friendly voice
            },
            systemInstruction: "You are Verasanti, a helpful and enthusiastic personal branding photographer assistant. You help users feel confident about their photos and give advice on style and branding."
          }
        });

        // Store session for cleanup
        sessionPromise.then(s => sessionRef.current = s);

      } catch (e: any) {
        console.error("Setup failed", e);
        if (mounted) {
          setStatus('error');
          setErrorMessage(e.message || "Failed to start audio session");
        }
      }
    };

    startSession();

    return () => {
      mounted = false;
      // Cleanup Audio
      inputContextRef.current?.close();
      outputContextRef.current?.close();
      
      // Cleanup Session
      if (sessionRef.current && typeof sessionRef.current.close === 'function') {
        try {
          sessionRef.current.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 w-80 flex flex-col items-center gap-4">
        <div className="flex w-full justify-between items-start">
          <div className="flex items-center gap-2 text-indigo-400">
            <Volume2 className="h-5 w-5" />
            <span className="font-semibold">Verasanti Voice</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-24 w-24 flex items-center justify-center">
           {status === 'connecting' && <Loader2 className="h-10 w-10 text-slate-500 animate-spin" />}
           
           {status === 'listening' && (
             <div className="relative">
               <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
               <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-indigo-500 text-indigo-400">
                 <Mic className="h-8 w-8" />
               </div>
             </div>
           )}

           {status === 'speaking' && (
             <div className="flex gap-1 items-center justify-center h-12">
               <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-[bounce_1s_infinite]" />
               <div className="w-1.5 h-10 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0.2s]" />
               <div className="w-1.5 h-8 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.4s]" />
               <div className="w-1.5 h-6 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0.1s]" />
             </div>
           )}

           {status === 'error' && (
             <div className="flex flex-col items-center text-center">
               <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
               <div className="text-red-400 text-sm font-bold">{errorMessage}</div>
             </div>
           )}
        </div>

        <div className="text-center">
          <p className="text-white font-medium">
            {status === 'connecting' && 'Connecting...'}
            {status === 'listening' && 'Listening...'}
            {status === 'speaking' && 'Speaking...'}
            {status === 'error' && 'Connection Error'}
          </p>
          <p className="text-slate-400 text-xs mt-1">
             {status === 'error' ? 'Check Cloud Console settings' : 'Ask me about your photos!'}
          </p>
        </div>
      </div>
    </div>
  );
};