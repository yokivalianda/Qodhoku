import React, { useEffect } from 'react';
import { QodhoProvider, useQodho } from './context/QodhoContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ThemeProvider } from './context/ThemeContext';
import OnboardingScreen from './screens/OnboardingScreen';
import SetupScreen from './screens/SetupScreen';
import DailyTargetScreen from './screens/DailyTargetScreen';
import HomeDashboard from './screens/HomeDashboard';
import QuickAddScreen from './screens/QuickAddScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import EditTotalsScreen from './screens/EditTotalsScreen';
import { getNotificationSettings, sendReminderNotification } from './utils/notifications';
import './App.css';

function AppRouter() {
  const { currentScreen, navigate } = useNavigation();
  const { hasOnboarded, token } = useQodho();

  useEffect(() => {
    // Sudah onboarding dan screen masih di auth/onboarding → langsung ke home
    if (hasOnboarded && (currentScreen === 'onboarding' || currentScreen === 'auth')) {
      navigate('home');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkNotification = () => {
      const { enabled, time } = getNotificationSettings();
      if (!enabled) return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      if (currentTime === time) {
        const lastNotified = localStorage.getItem('qodhoku_last_notified');
        const todayStr = now.toISOString().slice(0, 10);
        if (lastNotified !== todayStr) {
          sendReminderNotification();
          localStorage.setItem('qodhoku_last_notified', todayStr);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkNotification, 60000);
    return () => clearInterval(interval);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':  return <OnboardingScreen />;
      case 'setup':       return <SetupScreen />;
      case 'dailyTarget': return <DailyTargetScreen />;
      case 'home':        return <HomeDashboard />;
      case 'quickAdd':    return <QuickAddScreen />;
      case 'statistics':  return <StatisticsScreen />;
      case 'calendar':    return <CalendarScreen />;
      case 'profile':     return <ProfileScreen />;
      case 'auth':        return <AuthScreen />;
      case 'editTotals':  return <EditTotalsScreen />;
      default:            return <OnboardingScreen />;
    }
  };

  return (
    <div className="screen-wrapper" key={currentScreen}>
      {renderScreen()}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QodhoProvider>
        <NavigationProvider>
          <AppRouter />
        </NavigationProvider>
      </QodhoProvider>
    </ThemeProvider>
  );
}

export default App;
