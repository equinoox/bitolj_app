// DatabaseSync.tsx
import React, { useEffect, useContext, createContext } from 'react';
import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper';

// Types
type DatabaseSyncContextType = {
  syncNow: () => Promise<boolean>;
  lastSyncTime: number | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
};

// Constants
// MORAM DA SET UP-AM GOOGLE API
// MORAM DA SET UP-AM BACKGROUND_TASK_NAME
const BACKGROUND_TASK_NAME = 'DB_SYNC_TASK';
const DB_PATH = FileSystem.documentDirectory + 'bitolj.db';

// Create Context
const DatabaseSyncContext = createContext<DatabaseSyncContextType>({
  syncNow: async () => false,
  lastSyncTime: null,
  isInitialized: false,
  isLoading: false,
  error: null,
});

// Provider Component
export const DatabaseSyncProvider: React.FC<{
  children: React.ReactNode;
  dbPath?: string;
  googleWebClientId: string;
}> = ({ children, dbPath = DB_PATH, googleWebClientId }) => {
  const [lastSyncTime, setLastSyncTime] = React.useState<number | null>(null);
  const [lastModifiedTime, setLastModifiedTime] = React.useState<number>(0);
  const [isInitialized, setIsInitialized] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Configure Google Sign-In
  useEffect(() => {
    const initialize = async () => {
      try {
        // Configure Google Sign-In
        GoogleSignin.configure({
          scopes: ['https://www.googleapis.com/auth/drive.file'],
          webClientId: googleWebClientId,
        });

        // Try to sign in silently - skip the isSignedIn check that's causing errors
        try {
          await GoogleSignin.signInSilently();
        } catch (err) {
          // User needs to sign in manually
          try {
            await GoogleSignin.signIn();
          } catch (signInErr) {
            setError('Google Sign-In required');
          }
        }

        // Register background task
        await registerBackgroundTask();

        // Initialize lastModifiedTime
        const fileInfo = await FileSystem.getInfoAsync(dbPath);
        if (fileInfo.exists && fileInfo.modificationTime) {
          setLastModifiedTime(fileInfo.modificationTime);
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(`Initialization failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    initialize();

    return () => {
      // Task cleanup when component unmounts
      BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME).catch(console.error);
    };
  }, [dbPath, googleWebClientId]);

  // Check if DB was modified
  const isDBModified = async (): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (fileInfo.exists) {
        const modTime = fileInfo.modificationTime || 0;
        
        if (modTime > lastModifiedTime) {
          setLastModifiedTime(modTime);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking DB modification:', error);
      return false;
    }
  };

  // Upload DB to Google Drive
  const uploadDBToGoogleDrive = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      
      // Initialize GDrive with the access token
      const gdrive = new GDrive();
      gdrive.accessToken = tokens.accessToken;
      
      // Check if our backup file exists
      let fileId: string | null = null;
      
      try {
        const files = await gdrive.files.list({
          q: "name = 'myDatabase.db' and trashed = false"
        });
        
        if (files.files && files.files.length > 0) {
          fileId = files.files[0].id;
        }
      } catch (e) {
        console.log('No existing file found, will create new one');
      }
      
      // Convert the DB file to base64
      const base64Data = await FileSystem.readAsStringAsync(dbPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create media content from base64
      const mediaContent = Buffer.from(base64Data, 'base64');
      
      if (fileId) {
        // Update existing file using the updated API methods
        const uploader = gdrive.files.newMultipartUploader();
        uploader.setIdOfFileToUpdate(fileId);
        uploader.setData(mediaContent);
        uploader.setRequestBody({
          mimeType: 'application/x-sqlite3'
        });
        await uploader.execute();
        
        console.log('Database updated in Google Drive');
      } else {
        // Create new file using the updated API methods
        const uploader = gdrive.files.newMultipartUploader();
        uploader.setData(mediaContent);
        uploader.setRequestBody({
          name: 'myDatabase.db',
          parents: ['root'],
          mimeType: 'application/x-sqlite3'
        });
        const result = await uploader.execute();
        
        console.log('Database uploaded to Google Drive with ID:', result.id);
      }
      
      const now = Date.now();
      setLastSyncTime(now);
      setIsLoading(false);
      return true;
    } catch (error) {
      const errorMessage = `Error uploading to Google Drive: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  // Define background task
  if (!TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)) {
    TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
      try {
        const hasChanges = await isDBModified();
        
        if (hasChanges) {
          await uploadDBToGoogleDrive();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        }
        
        return BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  // Register background task
  const registerBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes minimum for iOS
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background sync task registered');
      return true;
    } catch (error) {
      console.error('Task registration failed:', error);
      return false;
    }
  };

  // Sync function to be called after database operations
  const syncNow = async (): Promise<boolean> => {
    if (!isInitialized) {
      setError('Sync component not initialized yet');
      return false;
    }
    
    try {
      const hasChanges = await isDBModified();
      if (hasChanges) {
        return await uploadDBToGoogleDrive();
      }
      return true; // No changes needed to sync
    } catch (error) {
      const errorMessage = `Sync failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  const value = {
    syncNow,
    lastSyncTime,
    isInitialized,
    isLoading,
    error,
  };

  return (
    <DatabaseSyncContext.Provider value={value}>
      {children}
    </DatabaseSyncContext.Provider>
  );
};

// Custom hook to use the database sync context
export const useDatabaseSync = () => {
  const context = useContext(DatabaseSyncContext);
  if (context === undefined) {
    throw new Error('useDatabaseSync must be used within a DatabaseSyncProvider');
  }
  return context;
};

// Standalone service for non-React contexts
export class DatabaseSyncService {
  private static instance: DatabaseSyncService;
  private lastModifiedTime: number = 0;
  private dbPath: string;
  private isInitialized: boolean = false;

  private constructor(dbPath: string = DB_PATH) {
    this.dbPath = dbPath;
  }

  public static getInstance(dbPath: string = DB_PATH): DatabaseSyncService {
    if (!DatabaseSyncService.instance) {
      DatabaseSyncService.instance = new DatabaseSyncService(dbPath);
    }
    return DatabaseSyncService.instance;
  }

  public async initialize(googleWebClientId: string): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        webClientId: googleWebClientId,
      });

      // Try to sign in directly, skipping the isSignedIn check
      try {
        await GoogleSignin.signInSilently();
      } catch (err) {
        // Try to sign in manually if silent sign-in fails
        await GoogleSignin.signIn();
      }

      // Initialize lastModifiedTime
      const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
      if (fileInfo.exists && fileInfo.modificationTime) {
        this.lastModifiedTime = fileInfo.modificationTime;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      return false;
    }
  }

  public async syncNow(): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Service not initialized. Call initialize() first');
      return false;
    }
    
    try {
      const hasChanges = await this.isDBModified();
      if (hasChanges) {
        return await this.uploadDBToGoogleDrive();
      }
      return true; // No changes needed to sync
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }

  private async isDBModified(): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
      
      if (fileInfo.exists) {
        const modTime = fileInfo.modificationTime || 0;
        
        if (modTime > this.lastModifiedTime) {
          this.lastModifiedTime = modTime;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking DB modification:', error);
      return false;
    }
  }

  private async uploadDBToGoogleDrive(): Promise<boolean> {
    try {
      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      
      // Initialize GDrive with the access token
      const gdrive = new GDrive();
      gdrive.accessToken = tokens.accessToken;
      
      // Check if our backup file exists
      let fileId: string | null = null;
      
      try {
        const files = await gdrive.files.list({
          q: "name = 'myDatabase.db' and trashed = false"
        });
        
        if (files.files && files.files.length > 0) {
          fileId = files.files[0].id;
        }
      } catch (e) {
        console.log('No existing file found, will create new one');
      }
      
      // Convert the DB file to base64
      const base64Data = await FileSystem.readAsStringAsync(this.dbPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create media content from base64
      const mediaContent = Buffer.from(base64Data, 'base64');
      
      if (fileId) {
        // Update existing file using the updated API methods
        const uploader = gdrive.files.newMultipartUploader();
        uploader.setIdOfFileToUpdate(fileId);
        uploader.setData(mediaContent);
        uploader.setRequestBody({
          mimeType: 'application/x-sqlite3'
        });
        await uploader.execute();
        
        console.log('Database updated in Google Drive');
      } else {
        // Create new file using the updated API methods
        const uploader = gdrive.files.newMultipartUploader();
        uploader.setData(mediaContent);
        uploader.setRequestBody({
          name: 'myDatabase.db',
          parents: ['root'],
          mimeType: 'application/x-sqlite3'
        });
        const result = await uploader.execute();
        
        console.log('Database uploaded to Google Drive with ID:', result.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      return false;
    }
  }
}