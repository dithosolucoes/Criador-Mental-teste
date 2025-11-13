import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import HomeScreen from './components/screens/HomeScreen';
import MealPlanScreen from './components/screens/MealPlanScreen';
import HealthPalScreen from './components/screens/HealthPalScreen';
import DiaryScreen from './components/screens/DiaryScreen';
import ResourcesScreen from './components/screens/ResourcesScreen';
import Auth from './components/Auth';
import { Screen } from './types';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'meal':
        return <MealPlanScreen />;
      case 'pal':
        return <HealthPalScreen />;
      case 'diary':
        return <DiaryScreen />;
      case 'resources':
        return <ResourcesScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="bg-gray-50 font-sans flex flex-col h-screen overflow-hidden">
      <main className="flex-grow pb-24 overflow-y-auto">
        {renderScreen()}
      </main>
      <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  );
};

export default App;
