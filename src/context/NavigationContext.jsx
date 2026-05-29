import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [currentScreen, setScreen] = useState('auth');
  const [prevScreen, setPrevScreen] = useState(null);

  const navigate = useCallback((screen) => {
    setPrevScreen(currentScreen);
    setScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    if (prevScreen) {
      setScreen(prevScreen);
      setPrevScreen(null);
    }
  }, [prevScreen]);

  return (
    <NavigationContext.Provider value={{ currentScreen, navigate, goBack, prevScreen }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
