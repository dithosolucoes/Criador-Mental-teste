import React, { useState, useRef } from 'react';
import { generateMealPlan, analyzeMealImage, generateTextToSpeech } from '../../services/api';
import { fileToBase64, decode, decodeAudioData } from '../../utils';

const MealPlanScreen: React.FC = () => {
  const [mealPlan, setMealPlan] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  if (!audioContextRef.current) {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  }

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setMealPlan('');
    try {
      const plan = await generateMealPlan();
      setMealPlan(plan);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      setMealPlan('Desculpe, não consegui gerar o plano. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      setAnalysis('');
      setImagePreview(URL.createObjectURL(file));
      try {
        const base64Image = await fileToBase64(file);
        const result = await analyzeMealImage(base64Image, file.type);
        setAnalysis(result);
      } catch (error) {
        console.error('Error analyzing image:', error);
        setAnalysis('Erro ao analisar a imagem.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handlePlayAudio = async () => {
    if (!mealPlan) return;
    try {
        const base64Audio = await generateTextToSpeech(mealPlan);
        const audioData = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, audioContextRef.current!, 24000, 1);
        
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current!.destination);
        source.start();
    } catch (error) {
        console.error("Error with TTS:", error);
        alert("Não foi possível reproduzir o áudio.");
    }
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    const isYes = analysis.toUpperCase().startsWith('SIM');
    const isNo = analysis.toUpperCase().startsWith('NÃO');

    if (isYes || isNo) {
      return (
        <div className={`p-4 rounded-lg text-left mt-4 border-2 ${isYes ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
          <div className="flex items-center">
             {isYes ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600 mr-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-600 mr-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
             )}
             <p className="text-xl text-gray-800">{analysis}</p>
          </div>
        </div>
      );
    }
    return <div className="p-4 bg-orange-50 rounded-lg text-xl mt-4">{analysis}</div>
  };


  return (
    <div className="p-6">
      <h1 className="text-5xl font-bold text-center text-teal-800 mb-8">Plano de Refeições</h1>
      
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Plano Alimentar Diário</h2>
        <button onClick={handleGeneratePlan} disabled={isLoading} className="w-full bg-teal-600 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-teal-700 disabled:bg-gray-400 transition-all duration-300">
          {isLoading ? 'Gerando...' : 'Gerar Novo Plano'}
        </button>
         {mealPlan && (
          <button onClick={handlePlayAudio} className="w-full mt-4 bg-sky-500 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-sky-600 transition-all duration-300">
            Ouvir o Plano
          </button>
        )}
        {isLoading && <p className="text-center mt-4 text-xl">Aguarde um momento...</p>}
        {mealPlan && <div className="mt-6 p-4 bg-teal-50 rounded-lg text-xl leading-relaxed whitespace-pre-wrap">{mealPlan}</div>}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Analisar minha Refeição</h2>
        <p className="text-xl text-gray-700 mb-4">Tire uma foto do seu prato e o Guardião dirá se é bom para você.</p>
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-orange-500 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-orange-600 transition-all duration-300">
          Tirar Foto do Prato
        </button>
        {isAnalyzing && <p className="text-center mt-4 text-xl">Analisando...</p>}
        {imagePreview && (
          <div className="mt-6 text-center">
            <img src={imagePreview} alt="Preview da refeição" className="max-w-full h-auto rounded-lg mx-auto mb-4" />
            {renderAnalysis()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanScreen;
