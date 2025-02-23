import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, BackHandler } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';

const DatabaseManagement = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const correctPassword = 'dbadmin';
  const db = useSQLiteContext();

  const handleBackup = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this platform.');
        return;
      }

      const dbPath = `${FileSystem.documentDirectory}SQLite/bitolj.db`;
      const date = new Date().toISOString().split('T')[0];
      const backupPath = `${FileSystem.documentDirectory}bitolj_backup_${date}.db`;

      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Baza podataka nije pronađena.');
        return;
      }

      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath
      });

      await Sharing.shareAsync(backupPath, {
        dialogTitle: 'Sačuvaj bazu podataka...',
        UTI: 'public.database',
        mimeType: 'application/x-sqlite3'
      });

      await FileSystem.deleteAsync(backupPath);
      Alert.alert(
        'Success',
        'Baza uspešno ubačena! Aplikacija će se resetovati da bi se promene sačuvale.',
        [
            {
                text: 'OK',
                onPress: () => {
            try {
                BackHandler.exitApp();
                } catch (error) {
                    console.error('Error closing app:', error);
                    Alert.alert('Please manually close and restart the app for changes to take effect');
                }
            }
        }
        ]
        );
    } catch (error) {
      console.error("Backup error:", error);
      Alert.alert('Error', 'Neuspešno čuvanje baze');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];
      
      const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
      const currentDbPath = `${sqliteDir}/bitolj.db`;
      const backupPath = `${sqliteDir}/bitolj.db.backup`;
      const tempPath = `${sqliteDir}/temp_import.db`;

      const sqliteDirInfo = await FileSystem.getInfoAsync(sqliteDir);
      if (!sqliteDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
      }

      await FileSystem.copyAsync({
        from: selectedFile.uri,
        to: tempPath
      });

      try {
        await db.closeAsync();
      } catch (error) {
        console.log('Database close error (expected):', error);
      }

      const currentDbExists = (await FileSystem.getInfoAsync(currentDbPath)).exists;
      if (currentDbExists) {
        await FileSystem.copyAsync({
          from: currentDbPath,
          to: backupPath
        });
      }

      try {
        if (currentDbExists) {
          await FileSystem.deleteAsync(currentDbPath);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await FileSystem.moveAsync({
          from: tempPath,
          to: currentDbPath
        });

        const newDbInfo = await FileSystem.getInfoAsync(currentDbPath);
        if (!newDbInfo.exists) {
          throw new Error('Failed to copy new database');
        }

        // Clean up backup
        if (await FileSystem.getInfoAsync(backupPath).then(info => info.exists)) {
          await FileSystem.deleteAsync(backupPath);
        }

        Alert.alert(
          'Success',
          'Baza uspešno ubačena! Aplikacija će se resetovati da bi se promene sačuvale.',
          [
            {
              text: 'OK',
              onPress: () => {
                try {
                  BackHandler.exitApp();
                } catch (error) {
                  console.error('Error closing app:', error);
                  Alert.alert('Please manually close and restart the app for changes to take effect');
                }
              }
            }
          ]
        );

      } catch (error) {
        console.error('Error during import:', error);
        // Restore backup if something went wrong
        if (await FileSystem.getInfoAsync(backupPath).then(info => info.exists)) {
          await FileSystem.copyAsync({
            from: backupPath,
            to: currentDbPath
          });
          await FileSystem.deleteAsync(backupPath);
        }
        throw error;
      }

    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Neuspešno ubacivanje baze.');
    }
  };

  const handleDeleteAllDatabases = async () => {
    try {
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
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        'Upozorenje',
        'Da li ste sigurni da želite da izbrišete bazu? Ova akcija ne može da se povrati.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Izbriši',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete the entire SQLite directory
                await FileSystem.deleteAsync(sqliteDir, { idempotent: true });
                
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
                Alert.alert('Error', 'Failed to delete databases');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete operation error:', error);
      Alert.alert('Error', 'An error occurred while trying to delete databases');
    }
  };

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      Alert.alert('Error', 'Incorrect password. Please try again.');
      setPassword('');
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
          />
          </View>
          <View className='justify-center items-center'>
          <TouchableOpacity
            onPress={handlePasswordSubmit}
            className="bg-orange rounded-xl w-1/3 min-h-[50px] justify-center items-center"
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
          <TouchableOpacity
            onPress={handleBackup}
            className="bg-orange rounded-xl w-2/3 min-h-[50px] justify-center items-center mb-4"
          >
            <Text className="text-black text-lg font-bold">Sačuvaj Bazu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleImport}
            className="bg-orange rounded-xl w-2/3 min-h-[50px] justify-center items-center mb-4"
          >
            <Text className="text-black text-lg font-bold">Ubaci novu Bazu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteAllDatabases}
            className="bg-red-500 rounded-xl w-2/3 min-h-[50px] justify-center items-center mb-4"
          >
            <Text className="text-black text-lg font-bold">Izbriši Bazu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DatabaseManagement;