import { useState } from 'react';
import Homepage from './components/Homepage';
import Wizard from './components/Wizard';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';

type Screen = 'home' | 'wizard' | 'login' | 'dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {currentScreen === 'home' && (
        <Homepage 
          onStartNow={() => setCurrentScreen('wizard')}
          onLogin={() => setCurrentScreen('login')}
        />
      )}
      {currentScreen === 'wizard' && (
        <Wizard onComplete={() => setCurrentScreen('dashboard')} />
      )}
      {currentScreen === 'login' && (
        <LoginRegister onLogin={() => setCurrentScreen('dashboard')} />
      )}
      {currentScreen === 'dashboard' && (
        <Dashboard 
          onCreateWebsite={() => setCurrentScreen('wizard')}
          onLogout={() => setCurrentScreen('home')}
          onGoHome={() => setCurrentScreen('home')}
        />
      )}
    </div>
  );
}