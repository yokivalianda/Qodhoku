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
import './App.css';

function AppRouter() {
  const { currentScreen, navigate } = useNavigation();
  const { hasOnboarded } = useQodho();

  // On first load, if user already onboarded, jump straight to home
  useEffect(() => {
    if (hasOnboarded && currentScreen === 'onboarding') {
      navigate('home');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
