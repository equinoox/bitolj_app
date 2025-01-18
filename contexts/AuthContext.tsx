import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user data when app starts
    loadUserData();
  }, []);

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
      } else {
        await SecureStore.deleteItemAsync('userData');
      }
      setUserDataState(data);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ userData, setUserData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}