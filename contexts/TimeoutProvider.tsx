import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AppState, Alert, BackHandler, Pressable } from 'react-native';
import { router } from 'expo-router';

interface TimeoutContextType {
  resetTimer: () => void;
}

interface TimeoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
}

const TimeoutContext = createContext<TimeoutContextType | undefined>(undefined);

export const TimeoutProvider: React.FC<TimeoutProviderProps> = ({ 
  children, 
  timeoutMinutes = 15 
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  const handleTimeout = () => {
    if (appState.current === 'active') {
      Alert.alert(
        'Session Timeout',
        'Application will close due to inactivity.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
              BackHandler.exitApp();
            }
          }
        ]
      );
    }
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(handleTimeout, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Initial setup
    resetTimer();

    // App state handler
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current === 'background' && nextAppState === 'active') {
        resetTimer();
      }
      appState.current = nextAppState;
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.remove();
    };
  }, []);

  return (
    <TimeoutContext.Provider value={{ resetTimer }}>
      <Pressable 
        onPress={resetTimer}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </TimeoutContext.Provider>
  );
};

export const useTimeout = (): TimeoutContextType => {
  const context = useContext(TimeoutContext);
  if (context === undefined) {
    throw new Error('useTimeout must be used within a TimeoutProvider');
  }
  return context;
};