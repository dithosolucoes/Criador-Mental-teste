import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UserProfile } from '../../types';

const HomeScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) console.error('Error fetching profile', error);
        else setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const dailyPlan = [
    { time: '08:00', task: 'Café da Manhã', details: 'Ovo mexido e mamão' },
    { time: '09:00', task: 'Remédio', details: 'Tomar o remédio para pressão' },
    { time: '12:30', task: 'Almoço', details: 'Frango grelhado e salada' },
    { time: '15:00', task: 'Lanche', details: 'Maçã assada com canela' },
    { time: '18:00', task: 'Caminhada Leve', details: '15 minutos dentro de casa' },
    { time: '20:00', task: 'Jantar', details: 'Sopa de legumes' },
  ];

  return (
    <div className="p-6 bg-teal-50 min-h-full">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-teal-800">
          {greeting}, Dona {profile?.nickname || 'Cyca'}!
        </h1>
        <p className="text-2xl text-gray-700 mt-2">Seu Guardião está aqui para ajudar.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-3 border-teal-200">Seu Plano para Hoje</h2>
        <ul className="space-y-5">
          {dailyPlan.map((item, index) => (
            <li key={index} className="flex items-center space-x-4 bg-gray-50 rounded-xl shadow p-4 border">
              <div className="bg-teal-600 text-white rounded-lg p-3 text-center w-24 flex-shrink-0">
                <p className="font-bold text-2xl">{item.time}</p>
              </div>
              <div>
                <p className="font-bold text-2xl text-gray-800">{item.task}</p>
                <p className="text-xl text-gray-600">{item.details}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="text-center">
        <button 
            className="bg-red-600 text-white font-bold py-6 px-10 rounded-full shadow-2xl hover:bg-red-700 transition-transform transform hover:scale-105 active:scale-100 focus:outline-none focus:ring-4 focus:ring-red-400"
            onClick={() => alert('Função de emergência a ser implementada. Ex: Ligar para um familiar ou serviço de emergência.')}
        >
            <span className="text-2xl">BOTÃO DE EMERGÊNCIA</span>
        </button>
        <p className="text-gray-600 mt-4 text-xl">Pressione em caso de emergência</p>
      </div>
    </div>
  );
};

export default HomeScreen;
