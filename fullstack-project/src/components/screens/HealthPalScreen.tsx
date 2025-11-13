import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession } from '@google/genai';
import { encode, decode, decodeAudioData } from '../../utils';
import { supabase } from '../../lib/supabaseClient';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

type TranscriptionEntry = {
  speaker: 'user' | 'model';
  text: string;
};

// Fetches the system instruction from the backend. This is not an edge function because it doesn't need to be.
// It's just a simple helper to construct the prompt string based on DB data.
// For simplicity in this refactor, we are constructing it on the client, but in a production app
// with more complex logic, this could be a separate helper function or view in the database.
const getSystemInstruction = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'You are a helpful assistant.';

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: tastesData } = await supabase.from('food_preferences').select('food, preference');
  const { data: latestExamData } = await supabase.from('exam_records').select('*').order('date', { ascending: false }).limit(1).single();

  const tastes = {
    liked: tastesData?.filter(t => t.preference === 'like').map(t => t.food) || [],
    disliked: tastesData?.filter(t => t.preference === 'dislike').map(t => t.food) || [],
  };

  const userProfile = profileData || {
    name: "Iracy Amancio Da Silva Gonçalves",
    nickname: "Cyca",
    age: 65,
    conditions: ["diabetes", "insuficiência cardíaca", "problemas renais"],
    potassium_level: 6.9,
  };

  let potassiumInfo = `Seu nível de potássio está atualmente em ${userProfile.potassium_level}, que é perigosamente alto.`;
  if (latestExamData?.potassium) {
      potassiumInfo = `De acordo com seu último exame de ${latestExamData.date}, seu nível de potássio está em ${latestExamData.potassium}.`;
      if (latestExamData.potassium > 5.2) {
          potassiumInfo += " Este valor é ALTO e requer atenção especial na dieta."
      } else if (latestExamData.potassium < 3.5) {
          potassiumInfo += " Este valor é BAIXO."
      } else {
          potassiumInfo += " Este valor está dentro da faixa normal."
      }
  }
  
  let tastesInfo = '';
  if (tastes) {
      if (tastes.liked.length > 0) {
          tastesInfo += ` Ela GOSTA de comer: ${tastes.liked.join(', ')}.`;
      }
      if (tastes.disliked.length > 0) {
          tastesInfo += ` Ela NÃO GOSTA de comer: ${tastes.disliked.join(', ')}.`;
      }
      if (tastesInfo) {
          tastesInfo = ` Leve em consideração as preferências alimentares dela.${tastesInfo} Use isso para personalizar suas sugestões.`
      }
  }

  return `Você é um assistente de saúde compassivo e altamente qualificado. Seu nome é Guardião. Você está ajudando a Sra. ${userProfile.name}, de ${userProfile.age} anos, a quem você deve se dirigir carinhosamente como "Dona ${userProfile.nickname}". 
Ela tem as seguintes condições de saúde: ${userProfile.conditions.join(', ')}. ${potassiumInfo} ${tastesInfo}
Sua principal responsabilidade é fornecer informações claras, simples e encorajadoras para ajudá-la a gerenciar sua saúde.
Fale em português do Brasil. Use uma linguagem simples e um tom amigável. Evite jargão médico complexo.
Sempre reforce a importância de seguir as orientações médicas e nunca substitua o conselho de um profissional de saúde.`;
}


const HealthPalScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [status, setStatus] = useState('Pronto para conversar. Pressione o botão.');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  let currentInputTranscription = '';
  let currentOutputTranscription = '';

  const startConversation = async () => {
    if (isRecording) return;

    try {
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      setIsRecording(true);
      setStatus('Ouvindo...');
      setTranscription([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const systemInstructionText = await getSystemInstruction();

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
             if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            const source = audioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription) {
              currentInputTranscription += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
                const fullInput = currentInputTranscription;
                const fullOutput = currentOutputTranscription;

                setTranscription(prev => [
                    ...prev,
                    { speaker: 'user', text: fullInput },
                    { speaker: 'model', text: fullOutput },
                ]);

                currentInputTranscription = '';
                currentOutputTranscription = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
            }

             if (message.serverContent?.interrupted) {
                for (const source of audioSourcesRef.current.values()) {
                    source.stop();
                    audioSourcesRef.current.delete(source);
                }
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live API error:', e);
            setStatus('Ocorreu um erro. Tente novamente.');
            stopConversation();
          },
          onclose: (e: CloseEvent) => {
            setStatus('Conversa encerrada.');
            stopConversation(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: systemInstructionText,
        },
      });

    } catch (error) {
      console.error('Error starting conversation:', error);
      setStatus('Não foi possível iniciar. Verifique a permissão do microfone.');
      setIsRecording(false);
    }
  };

 const stopConversation = (closeSession = true) => {
    if (!isRecording) return;

    if (closeSession && sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
    }

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    audioContextRef.current?.close().then(() => audioContextRef.current = null);
    
    for (const source of audioSourcesRef.current.values()) {
        source.stop();
    }
    audioSourcesRef.current.clear();
    
    setIsRecording(false);
    setStatus('Pronto para conversar. Pressione o botão.');
    sessionPromiseRef.current = null;
  };
  
  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      stopConversation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 flex flex-col h-full bg-gray-100">
      <h1 className="text-4xl font-bold text-center text-teal-800 mb-2">Converse com o Guardião</h1>
      <p className="text-center text-2xl text-gray-700 mb-4">{status}</p>
      
      <div className="flex-grow bg-white rounded-2xl shadow-inner p-4 overflow-y-auto mb-4 space-y-4">
        {transcription.map((entry, index) => (
          <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-md text-xl shadow ${entry.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-teal-700 text-white'}`}>
              <p className="font-bold capitalize mb-1">{entry.speaker === 'user' ? 'Você' : 'Guardião'}</p>
              {entry.text}
            </div>
          </div>
        ))}
        {transcription.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-gray-400 text-center">O histórico da conversa aparecerá aqui.</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center items-center">
        <button
          onClick={isRecording ? stopConversation : startConversation}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
            ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-teal-600 text-white'}
          `}
        >
          {/* Microphone Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.5a.5.5 0 01.5.5v.5a2.5 2.5 0 01-5 0v-.5a.5.5 0 01.5-.5h4zM4 11a1 1 0 011-1h1.07a5.002 5.002 0 008.86 0H15a1 1 0 110 2h-1.07a5.002 5.002 0 00-8.86 0H5a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HealthPalScreen;
