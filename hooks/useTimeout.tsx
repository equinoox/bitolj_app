import { useState, useEffect, useRef } from "react";
import { Alert, BackHandler, AppState } from "react-native";

// Timeout duration: 10 seconds (10 * 1000 ms)
const TIMEOUT_DURATION = 20 * 1000;

export const useTimeout = () => {
  const [isTimeout, setIsTimeout] = useState(false); // Track timeout state
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState); // Track the app state
  const isTimeoutRef = useRef(false); // To avoid resetting during the logout process

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current); // Clear the previous timeout
    timeoutRef.current = setTimeout(handleLogout, TIMEOUT_DURATION); // Set a new timeout
    setIsTimeout(false); // Reset timeout state
    isTimeoutRef.current = false; // Reset timeout reference
  };

  const handleLogout = () => {
    if (isTimeoutRef.current) return; // If already logged out, prevent further action

    isTimeoutRef.current = true; // Mark that we are logging out
    Alert.alert("Session Timeout", "The application will close due to inactivity.", [
      { text: "OK", onPress: () => BackHandler.exitApp() }, // Exit the app
    ]);
    setIsTimeout(true); // Set timeout state to true after logout
  };

  useEffect(() => {
    resetTimer(); // Initialize the timeout

    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active" && appState.current === "background") {
        resetTimer(); // Reset timeout when app comes to the foreground
      }
      appState.current = state; // Update the current app state
    });

    // Cleanup on component unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      appStateListener.remove();
    };
  }, []);

  return { resetTimer, isTimeout }; // Return resetTimer function and timeout state
};