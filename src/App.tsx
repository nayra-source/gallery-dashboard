import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { DeviceListScreen } from './components/DeviceListScreen';
import { DeviceDataScreen } from './components/DeviceDataScreen';
import { DeviceSummary } from './types';

const MainContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<DeviceSummary | null>(null);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Layout>
      {selectedDevice ? (
        <DeviceDataScreen
          device={selectedDevice}
          onBack={() => setSelectedDevice(null)}
        />
      ) : (
        <DeviceListScreen
          onSelectDevice={(device) => setSelectedDevice(device)}
        />
      )}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
