import React from 'react';
import { HomeIcon, MealIcon, PalIcon, DiaryIcon, ResourcesIcon } from './icons';
import { Screen } from '../types';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  screen: Screen;
  isActive: boolean;
  onClick: (screen: Screen) => void;
}> = ({ icon, label, screen, isActive, onClick }) => {
  const activeClasses = isActive ? 'text-teal-600' : 'text-gray-600 hover:text-teal-500';
  return (
    <button
      onClick={() => onClick(screen)}
      className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${activeClasses}`}
    >
      {icon}
      <span className="text-base font-medium mt-1">{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t-2 border-gray-200 shadow-lg flex justify-around items-center px-2 z-50">
      <NavItem
        icon={<HomeIcon />}
        label="Início"
        screen="home"
        isActive={activeScreen === 'home'}
        onClick={setActiveScreen}
      />
      <NavItem
        icon={<MealIcon />}
        label="Refeições"
        screen="meal"
        isActive={activeScreen === 'meal'}
        onClick={setActiveScreen}
      />
      <NavItem
        icon={<PalIcon />}
        label="Guardião"
        screen="pal"
        isActive={activeScreen === 'pal'}
        onClick={setActiveScreen}
      />
      <NavItem
        icon={<DiaryIcon />}
        label="Diário"
        screen="diary"
        isActive={activeScreen === 'diary'}
        onClick={setActiveScreen}
      />
      <NavItem
        icon={<ResourcesIcon />}
        label="Recursos"
        screen="resources"
        isActive={activeScreen === 'resources'}
        onClick={setActiveScreen}
      />
    </nav>
  );
};

export default BottomNav;
