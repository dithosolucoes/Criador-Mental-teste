import React, { useState } from 'react';
import { findNearbyHealthSpots, getComplexAnswer, generateImage } from '../../services/api';
import { GroundingChunk } from '../../types';

type ActiveTab = 'find' | 'ask' | 'create';

const ResourcesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('find');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ text: string, places?: GroundingChunk[], imageUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        () => {
          setLocationError('Não foi possível obter a localização. Por favor, habilite a permissão no seu navegador.');
        }
      );
    } else {
      setLocationError("Geolocalização não é suportada por este navegador.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setResult(null);

    try {
      if (activeTab === 'find') {
        if (!location) {
            alert("Por favor, permita o acesso à localização primeiro.");
            setIsLoading(false);
            return;
        }
        const response = await findNearbyHealthSpots(query, location);
        setResult({ text: response.text, places: response.places });
      } else if (activeTab === 'ask') {
        const text = await getComplexAnswer(query);
        setResult({ text });
      } else if (activeTab === 'create') {
        const imageUrl = await generateImage(query);
        setResult({ text: `Imagem gerada para: "${query}"`, imageUrl: `data:image/jpeg;base64,${imageUrl}` });
      }
    } catch (error) {
      console.error('Error in resources screen:', error);
      setResult({ text: 'Ocorreu um erro ao processar sua solicitação.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'find':
        return {
          title: "Encontrar Locais Saudáveis",
          placeholder: "Ex: restaurantes com comida de verdade",
          buttonText: "Buscar Perto de Mim",
        };
      case 'ask':
        return {
          title: "Pergunte ao Especialista",
          placeholder: "Ex: por que o potássio alto é perigoso?",
          buttonText: "Perguntar",
        };
      case 'create':
         return {
          title: "Canto Criativo",
          placeholder: "Ex: um jardim tranquilo com um riacho",
          buttonText: "Gerar Imagem",
        };
      default: return {};
    }
  };

  const { title, placeholder, buttonText } = renderContent();

  return (
    <div className="p-6">
      <h1 className="text-5xl font-bold text-center text-teal-800 mb-8">Recursos</h1>

      <div className="flex justify-around mb-8 bg-gray-200 rounded-xl p-2">
        <button onClick={() => setActiveTab('find')} className={`w-full py-4 text-xl font-semibold rounded-lg ${activeTab === 'find' ? 'bg-white text-teal-700 shadow' : 'text-gray-700'}`}>Encontrar</button>
        <button onClick={() => setActiveTab('ask')} className={`w-full py-4 text-xl font-semibold rounded-lg ${activeTab === 'ask' ? 'bg-white text-teal-700 shadow' : 'text-gray-700'}`}>Perguntar</button>
        <button onClick={() => setActiveTab('create')} className={`w-full py-4 text-xl font-semibold rounded-lg ${activeTab === 'create' ? 'bg-white text-teal-700 shadow' : 'text-gray-700'}`}>Criar</button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{title}</h2>
        {activeTab === 'find' && !location && (
            <div className="mb-4">
                <button onClick={getLocation} className="w-full bg-blue-500 text-white font-bold py-4 px-4 rounded-xl text-xl hover:bg-blue-600">
                    Permitir Localização
                </button>
                {locationError && <p className="text-red-500 mt-2 text-lg">{locationError}</p>}
            </div>
        )}
        <form onSubmit={handleSubmit}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-xl focus:ring-teal-500 focus:border-teal-500"
            rows={4}
          />
          <button type="submit" disabled={isLoading} className="w-full mt-4 bg-teal-600 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-teal-700 disabled:bg-gray-400">
            {isLoading ? 'Pensando...' : buttonText}
          </button>
        </form>

        {isLoading && <p className="text-center mt-4 text-xl">Aguarde...</p>}
        {result && (
          <div className="mt-6 p-4 bg-teal-50 rounded-lg">
            {result.imageUrl ? (
              <img src={result.imageUrl} alt={result.text} className="rounded-lg mx-auto"/>
            ) : (
              <p className="text-xl leading-relaxed whitespace-pre-wrap">{result.text}</p>
            )}
            {result.places && result.places.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-xl">Lugares encontrados:</h3>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  {result.places.map((place, index) => place.maps && (
                    <li key={index} className="text-lg">
                        <a href={place.maps.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{place.maps.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesScreen;
