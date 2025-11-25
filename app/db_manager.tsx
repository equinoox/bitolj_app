import { View, Text, TouchableOpacity, Alert, TextInput, BackHandler, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';

const DatabaseManagement = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  // Store password in environment variables or use a more secure approach in production
  const correctPassword = 'dbadmin';
  const db = useSQLiteContext();
  const operationInProgress = useRef(false);
  

  // Add a handler for the back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (operationInProgress.current) {
        Alert.alert('Operation in Progress', 'Please wait for the current operation to complete.');
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    });

    return () => backHandler.remove();
  }, []);

  const showConfirmationDialog = (title: string, message: string, onConfirm: () => void): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Continue',
            onPress: () => {
              onConfirm();
              resolve(true);
            }
          }
        ]
      );
    });
  };

  const updateStatus = async (message: string, delayMs: number = 500): Promise<void> => {
    setStatusMessage(message);
    // Use smaller delays for better UX while still showing progress
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  };

  const handleBackup = async () => {
    if (operationInProgress.current) {
      Alert.alert('Operation in Progress', 'Please wait for the current operation to complete.');
      return;
    }
    
    operationInProgress.current = true;
    setIsLoading(true);
    
    try {
      await updateStatus('Preparing backup...');
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this platform.');
      }

      // Close existing connections to ensure file isn't locked
      await updateStatus('Closing database connection...', 2000);
      
      try {
        await db.closeAsync();
      } catch (error) {
        console.log('Expected error when closing DB:', error);
      }

      // Path definitions with scoped storage considerations for Android 10+
      const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
      const dbPath = `${sqliteDir}/bitolj.db`;
      
      // Generate unique timestamp for filename with readable format
      const date = new Date();
      const timestamp = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;
      const backupFileName = `${timestamp}.db`;
      const tempBackupPath = `${FileSystem.cacheDirectory}${backupFileName}`;
      
      // Verify source DB exists
      await updateStatus('Checking database...', 2000);
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        throw new Error('Baza podataka nije pronađena.');
      }

      // Create a fresh copy in cache directory for sharing
      await updateStatus('Copying database...', 2000);
      
      // Use copyAsync with more reliable error handling
      try {
        await FileSystem.copyAsync({
          from: dbPath,
          to: tempBackupPath
        });
      } catch (copyError) {
        console.error('Copy error details:', copyError);
        throw new Error(`Failed to copy database: ${copyError instanceof Error ? copyError.message : 'Unknown error'}`);
      }
      
      // Verify backup was created successfully
      const backupInfo = await FileSystem.getInfoAsync(tempBackupPath);
      if (!backupInfo.exists) {
        throw new Error('Backup file creation failed');
      }
      
      if (backupInfo.size === 0) {
        throw new Error('Backup file is empty. The database may be corrupted or locked.');
      }
      
      // Share the backup file
      await updateStatus('Opening share dialog...', 2000);
      
      // Add MIME type and content type hints for Android 11+
      await Sharing.shareAsync(tempBackupPath, {
        dialogTitle: 'Sačuvaj bazu podataka...',
        UTI: 'public.database',
        mimeType: 'application/x-sqlite3'
      });
      
      // Clean up temp file after sharing dialog is dismissed
      await updateStatus('Cleaning up...', 2000);
      
      try {
        await FileSystem.deleteAsync(tempBackupPath, { idempotent: true });
      } catch (deleteError) {
        console.log('Failed to delete temp file, will be cleaned up later:', deleteError);
      }
      
      Alert.alert(
        'Success',
        'Baza uspešno sačuvana!'
      );
    } catch (error) {
      console.error("Backup error:", error);
      Alert.alert('Error', `Neuspešno čuvanje baze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      operationInProgress.current = false;
    }
  };

  const handleImport = async () => {
    if (operationInProgress.current) {
      Alert.alert('Operation in Progress', 'Please wait for the current operation to complete.');
      return;
    }
    
    operationInProgress.current = true;
    setIsLoading(true);
    
    try {
      await updateStatus('Preparing import...');
      
      // Pick document
      await updateStatus('Selecting file...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/octet-stream', 'application/x-sqlite3'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        operationInProgress.current = false;
        setIsLoading(false);
        setStatusMessage('');
        return;
      }

      const selectedFile = result.assets[0];
      
      // Better validation for SQLite files
      const isValidSQLite = selectedFile.name.endsWith('.db') || 
                           selectedFile.mimeType?.includes('sqlite') ||
                           selectedFile.mimeType?.includes('octet-stream');
                           
      if (!isValidSQLite) {
        const shouldContinue = await showConfirmationDialog(
          'Warning', 
          'The selected file may not be an SQLite database. Continue anyway?',
          () => {}
        );
        
        if (!shouldContinue) {
          operationInProgress.current = false;
          setIsLoading(false);
          setStatusMessage('');
          return;
        }
      }
      
      await continueImport(selectedFile);
      
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', `Neuspešno ubacivanje baze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      operationInProgress.current = false;
    }
  };

  interface SelectedFile {
    uri: string;
    name?: string;
    mimeType?: string;
    size?: number;
  }

  const continueImport = async (selectedFile: SelectedFile) => {
    try {
      await updateStatus('Closing database connection...', 2000);
      
      // Close the existing database connection
      try {
        await db.closeAsync();
      } catch (error) {
        console.log('Database close error (expected):', error);
      }

      // Path definitions
      const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
      const currentDbPath = `${sqliteDir}/bitolj.db`;
      const timestamp = Date.now();
      const backupPath = `${sqliteDir}/bitolj_${timestamp}.backup.db`;
      const tempPath = `${FileSystem.cacheDirectory}temp_import_${timestamp}.db`;

      // Ensure directory exists
      await updateStatus('Preparing directory...', 2000);
      
      try {
        const sqliteDirInfo = await FileSystem.getInfoAsync(sqliteDir);
        if (!sqliteDirInfo.exists) {
          await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
        }
      } catch (dirError) {
        console.error('Directory creation error:', dirError);
        throw new Error('Failed to create database directory');
      }

      // Copy selected file to temp location with improved error handling
      await updateStatus('Validating new database...', 2000);
      
      try {
        await FileSystem.copyAsync({
          from: selectedFile.uri,
          to: tempPath
        });
        
        // Verify temp file was created successfully
        const tempFileInfo = await FileSystem.getInfoAsync(tempPath);
        if (!tempFileInfo.exists || tempFileInfo.size === 0) {
          throw new Error('Selected file appears to be invalid or empty');
        }
      } catch (copyError: unknown) {
        console.error('Error copying new database:', copyError);
        throw new Error('Failed to copy the selected file');
      }

      // Create backup of existing database with retries
      const currentDbExists = (await FileSystem.getInfoAsync(currentDbPath)).exists;
      
      if (currentDbExists) {
        await updateStatus('Backing up current database...', 2000);
        
        let backupSuccess = false;
        const maxRetries = 3;
        
        for (let i = 0; i < maxRetries && !backupSuccess; i++) {
          try {
            await FileSystem.copyAsync({
              from: currentDbPath,
              to: backupPath
            });
            
            // Verify backup was created
            const backupInfo = await FileSystem.getInfoAsync(backupPath);
            backupSuccess = backupInfo.exists && backupInfo.size > 0;
            
            if (backupSuccess) break;
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (backupError) {
            console.error(`Backup attempt ${i+1} failed:`, backupError);
            if (i === maxRetries - 1) {
              throw new Error('Failed to create backup of existing database after multiple attempts');
            }
          }
        }
        
        if (!backupSuccess) {
          throw new Error('Failed to create a valid backup of the current database');
        }
      }

      // Critical section with improved reliability
      try {
        // Remove existing database if present
        if (currentDbExists) {
          await updateStatus('Removing current database...', 2000);
          await FileSystem.deleteAsync(currentDbPath, { idempotent: true });
          
          // Wait for deletion to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify deletion
          const deletedCheck = await FileSystem.getInfoAsync(currentDbPath);
          if (deletedCheck.exists) {
            throw new Error('Failed to remove existing database - it may be locked by another process');
          }
        }

        // Move new database into place
        await updateStatus('Installing new database...', 2000);
        
        await FileSystem.moveAsync({
          from: tempPath,
          to: currentDbPath
        });

        // Verify new database was installed
        const newDbInfo = await FileSystem.getInfoAsync(currentDbPath);
        if (!newDbInfo.exists) {
          throw new Error('Failed to install new database');
        }
        
        if (newDbInfo.size === 0) {
          throw new Error('Installed database is empty - please check the source file');
        }

        const shouldRestart = await showConfirmationDialog(
          'Success',
          'Baza uspešno ubačena! Aplikacija će se resetovati da bi se promene sačuvale.',
          () => {}
        );
        
        if (shouldRestart) {
          try {
            BackHandler.exitApp();
          } catch (exitError) {
            console.error('Error closing app:', exitError);
            Alert.alert('Please manually close and restart the app for changes to take effect');
          }
        }

      } catch (error) {
        console.error('Error during database replacement:', error);
        
        // Restore backup if something went wrong
        await updateStatus('Error occurred, restoring backup...', 2000);
        
        const backupExists = await FileSystem.getInfoAsync(backupPath).then(info => info.exists);
        
        if (backupExists) {
          try {
            // First ensure target doesn't exist
            const currentExists = await FileSystem.getInfoAsync(currentDbPath).then(info => info.exists);
            if (currentExists) {
              await FileSystem.deleteAsync(currentDbPath, { idempotent: true });
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Then restore the backup
            await FileSystem.copyAsync({
              from: backupPath,
              to: currentDbPath
            });
            
            // Verify restoration
            const restoredCheck = await FileSystem.getInfoAsync(currentDbPath);
            if (!restoredCheck.exists || restoredCheck.size === 0) {
              throw new Error('Failed to restore database backup. Please restart the app.');
            }
          } catch (restoreError) {
            console.error('Error restoring backup:', restoreError);
            throw new Error('Failed to restore from backup. The database may be corrupted.');
          }
        }
        
        throw error;
      }

    } catch (error) {
      console.error('Import process error:', error);
      Alert.alert('Error', `Neuspešno ubacivanje baze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up any backup files older than a day
      cleanupOldBackups();
    }
  };

  const cleanupOldBackups = async () => {
    try {
      const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
      
      // Check if directory exists first to avoid errors
      const dirExists = await FileSystem.getInfoAsync(sqliteDir).then(info => info.exists);
      if (!dirExists) return;
      
      const dirContents = await FileSystem.readDirectoryAsync(sqliteDir);
      
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      for (const file of dirContents) {
        if (file.includes('.backup.db')) {
          const filePath = `${sqliteDir}/${file}`;
          
          // Extract timestamp from filename if possible
          const timeMatch = file.match(/bitolj_(\d+)\.backup\.db/);
          if (timeMatch && parseInt(timeMatch[1]) < oneDayAgo) {
            try {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
            } catch (deleteError) {
              console.log(`Failed to delete old backup ${file}:`, deleteError);
            }
          }
        }
      }
    } catch (error) {
      console.log('Cleanup error:', error);
      // Non-critical error, so just log it
    }
  };

  const handleDeleteAllDatabases = async () => {
    if (operationInProgress.current) {
      Alert.alert('Operation in Progress', 'Please wait for the current operation to complete.');
      return;
    }
    
    operationInProgress.current = true;
    setIsLoading(true);
    
    try {
      await updateStatus('Preparing to delete database...');
      
      // Close current database connection
      try {
        await db.closeAsync();
      } catch (error) {
        console.log('Database close error (expected):', error);
      }

      // Get the SQLite directory path
      const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
      
      // Check if directory exists
      const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
      if (!dirInfo.exists) {
        Alert.alert('Info', 'Nema baza u direktorijumu.');
        operationInProgress.current = false;
        setIsLoading(false);
        setStatusMessage('');
        return;
      }

      // Show confirmation dialog with extra verification
      Alert.alert(
        'Upozorenje',
        'Da li ste sigurni da želite da izbrišete bazu? Ova akcija ne može da se povrati.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              operationInProgress.current = false;
              setIsLoading(false);
              setStatusMessage('');
            }
          },
          {
            text: 'Izbriši',
            style: 'destructive',
            onPress: async () => {
              // Second confirmation for destructive action
              Alert.alert(
                'Konačna potvrda',
                'Da li ste POTPUNO sigurni da želite da izbrišete bazu? Ova akcija je trajna.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                      operationInProgress.current = false;
                      setIsLoading(false);
                      setStatusMessage('');
                    }
                  },
                  {
                    text: 'Izbriši',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await updateStatus('Brisanje baze...', 1500);
                        
                        // Try to delete individual files first for better compatibility
                        try {
                          const files = await FileSystem.readDirectoryAsync(sqliteDir);
                          for (const file of files) {
                            await FileSystem.deleteAsync(`${sqliteDir}/${file}`, { idempotent: true });
                          }
                        } catch (fileError) {
                          console.log('Error deleting individual files:', fileError);
                        }
                        
                        // Then try to delete the directory
                        await FileSystem.deleteAsync(sqliteDir, { idempotent: true });
                        
                        // Verify directory is deleted
                        const checkAfterDelete = await FileSystem.getInfoAsync(sqliteDir);
                        if (checkAfterDelete.exists) {
                          console.warn('Directory still exists after deletion attempt');
                        }
                        
                        Alert.alert(
                          'Success',
                          'Baza podataka uspešno izbrisana. Aplikacija će se resetovati kako bi se sačuvale promene.',
                          [
                            {
                              text: 'OK',
                              onPress: () => {
                                try {
                                  BackHandler.exitApp();
                                } catch (error) {
                                  console.error('Error closing app:', error);
                                  Alert.alert('Please manually close and restart the app');
                                }
                              }
                            }
                          ]
                        );
                      } catch (error) {
                        console.error('Error deleting databases:', error);
                        Alert.alert('Error', `Failed to delete databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        operationInProgress.current = false;
                        setIsLoading(false);
                        setStatusMessage('');
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete operation error:', error);
      Alert.alert('Error', `An error occurred while trying to delete databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
      operationInProgress.current = false;
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handlePasswordSubmit = async () => {
    setIsLoading(true);
    try {
      if (password === correctPassword) {
        await SecureStore.setItemAsync('isDbAdmin', 'true');
        setIsAuthenticated(true);
      } else {
        Alert.alert('Error', 'Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 p-4 bg-background">
      {!isAuthenticated ? (
        <View>
          <Text className="text-lg text-center text-black mb-4">
            Unesi šifru kako bi pristupio DatabaseManagement-u:
          </Text>
          <View className='items-center justify-center'>
            <TextInput
              className="border border-gray-400 w-2/3 rounded-xl p-3 mb-4"
              placeholder="Enter Password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handlePasswordSubmit}
            />
          </View>
          <View className='justify-center items-center'>
            <TouchableOpacity
              onPress={handlePasswordSubmit}
              className="bg-orange rounded-xl w-1/3 min-h-[50px] justify-center items-center"
              disabled={isLoading}
            >
              <Text className="text-black text-lg font-bold">Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className='justify-center items-center'>
          <View className='items-center justify-center mb-3 bg-primary rounded-xl p-2'>
            <Text className="text-red-600 text-center text-lg font-semibold italic">
              Upozorenje!{"\n"}
              Pre čuvanja baze na udaljeni direktorijum, obavezno resetovati aplikaciju.{"\n"}
              Pri završetku svake funkcije sa bazom podataka,{"\n"}
              obavezno prekinuti proces u{" "}
              <Text className="font-extrabold text-center">Android Floating Windows</Text>-u.
            </Text>
          </View>
          
          {isLoading && (
            <View className="bg-white bg-opacity-80 absolute inset-0 flex justify-center items-center z-50">
              <ActivityIndicator size="large" color="#FF8C00" />
              <Text className="mt-2 text-center font-medium">{statusMessage}</Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={handleBackup}
            disabled={isLoading || operationInProgress.current}
            className={`bg-orange rounded-xl w-2/3 min-h-[50px] justify-center items-center mb-4 ${(isLoading || operationInProgress.current) ? 'opacity-50' : ''}`}
          >
            <Text className="text-black text-lg font-bold">Sačuvaj Bazu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleImport}
            disabled={isLoading || operationInProgress.current}
            className={`bg-orange rounded-xl w-2/3 min-h-[50px] justify-center items-center mb-4 ${(isLoading || operationInProgress.current) ? 'opacity-50' : ''}`}
          >
            <Text className="text-black text-lg font-bold">Ubaci Bazu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteAllDatabases}
            disabled={isLoading || operationInProgress.current}
            className={`bg-red-500 rounded-xl w-2/3 min-h-[50px] justify-center items-center mb-4 ${(isLoading || operationInProgress.current) ? 'opacity-50' : ''}`}
          >
            <Text className="text-black text-lg font-bold">Izbriši Bazu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DatabaseManagement;