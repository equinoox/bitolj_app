import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

interface UserData {
  id_korisnik: number;
  ime: string;
  prezime: string;
  role: string;
}

interface AuthContextType {
  userData: UserData | null;
  setUserData: (data: UserData | null) => Promise<void>;
  isLoading: boolean;
  isSessionExpired: boolean;
  resetInactivityTimeout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  
  const TIMEOUT_DURATION = 10 * 1000; // 3 minuta

  useEffect(() => {
    loadUserData();
  }, []);

  // Timeout logika - aktivira se samo za admin korisnike
  useEffect(() => {
    if (userData && userData.role === 'admin' && !isSessionExpired) {
      resetInactivityTimeout();

      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        if (inactivityTimeout.current) {
          clearTimeout(inactivityTimeout.current);
        }
        subscription.remove();
      };
    } else {
      // Očisti timeout ako korisnik nije admin ili je sesija istekla
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
        inactivityTimeout.current = null;
      }
    }
  }, [userData, isSessionExpired]);

  const loadUserData = async () => {
    try {
      const storedData = await SecureStore.getItemAsync('userData');
      if (storedData) {
        setUserDataState(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserData = async (data: UserData | null) => {
    try {
      if (data) {
        await SecureStore.setItemAsync('userData', JSON.stringify(data));
        setIsSessionExpired(false);
      } else {
        await SecureStore.deleteItemAsync('userData');
        setIsSessionExpired(false);
        if (inactivityTimeout.current) {
          clearTimeout(inactivityTimeout.current);
        }
      }
      setUserDataState(data);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const resetInactivityTimeout = () => {
    // Proveri da li je korisnik admin pre nego što resetuješ timeout
    if (isSessionExpired || !userData || userData.role !== 'admin') return;

    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }

    inactivityTimeout.current = setTimeout(() => {
      setIsSessionExpired(true);
    }, TIMEOUT_DURATION);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Proveri da li je korisnik admin pre nego što obradiš app state
    if (!userData || userData.role !== 'admin') return;

    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      resetInactivityTimeout();
    } else if (nextAppState.match(/inactive|background/)) {
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
    }

    appState.current = nextAppState;
  };

  return (
    <AuthContext.Provider value={{ 
      userData, 
      setUserData, 
      isLoading,
      isSessionExpired,
      resetInactivityTimeout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}