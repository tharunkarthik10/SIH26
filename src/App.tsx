import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { DemoProvider } from './context/DemoContext';
import { MobileLayout } from './components/layout/MobileLayout';
import { MobileTab } from './components/layout/BottomNav';

import { LoginPage } from './pages/LoginPage';
import { DevicePage } from './pages/DevicePage';
import { StripPage } from './pages/StripPage';
import { ReadPage } from './pages/ReadPage';
import { ProfilePage } from './pages/ProfilePage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<MobileTab>('read');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sky-700 font-sans text-sm font-medium">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Initializing SIH Mobile Dosimeter App...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <MobileLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'device' && <DevicePage />}
      {activeTab === 'strip' && <StripPage />}
      {activeTab === 'read' && <ReadPage />}
      {activeTab === 'profile' && <ProfilePage />}
    </MobileLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <DemoProvider>
          <AppContent />
        </DemoProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
