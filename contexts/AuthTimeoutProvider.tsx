import React, { createContext, useContext, useEffect, useRef } from "react";
import { AppState, Alert, BackHandler, TouchableWithoutFeedback, View } from "react-native";
import { useRouter } from "expo-router";

// Timeout duration: 60 minutes (60 * 60 * 1000 ms)
const TIMEOUT_DURATION = 5000;

const AuthTimeoutContext = createContext({
  resetTimeout: () => {},
});

// Activity wrapper component to detect user interactions
const ActivityDetector = ({ children, onActivity }: { children: React.ReactNode; onActivity: () => void }) => {
  const handleActivity = () => {
    onActivity();
  };

  return (
    <TouchableWithoutFeedback onPress={handleActivity}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
};

export const AuthTimeoutProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const lastActivityRef = useRef(Date.now());

  const resetTimeout = () => {
    // Update last activity timestamp
    lastActivityRef.current = Date.now();
    
    // Clear the previous timeout and start a new one
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(checkInactivity, TIMEOUT_DURATION);
  };

  const checkInactivity = () => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    
    if (timeSinceLastActivity >= TIMEOUT_DURATION) {
      handleLogout();
    } else {
      // If user was active recently, set a new timeout for the remaining duration
      const remainingTime = TIMEOUT_DURATION - timeSinceLastActivity;
      timeoutRef.current = setTimeout(checkInactivity, remainingTime);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sesija istekla",
      "Aplikacija će se zatvoriti zbog neaktivnosti.",
      [
        {
          text: "OK",
          onPress: () => BackHandler.exitApp(),
        },
      ]
    );
  };

  useEffect(() => {
    resetTimeout(); // Start timeout on component mount

    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active" && appState.current === "background") {
        // App just came back from background, reset timeout
        resetTimeout();
      }
      appState.current = state;
    });

    // Set up periodic check for inactivity
    const activityCheckInterval = setInterval(() => {
      checkInactivity();
    }, 60000); // Check every minute

    // Cleanup function
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearInterval(activityCheckInterval);
      appStateListener.remove();
    };
  }, []);

  return (
    <AuthTimeoutContext.Provider value={{ resetTimeout }}>
      <ActivityDetector onActivity={resetTimeout}>{children}</ActivityDetector>
    </AuthTimeoutContext.Provider>
  );
};

export const useLoginTimeout = () => useContext(AuthTimeoutContext);
