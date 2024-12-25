import { StyleSheet, Text, View } from 'react-native'
// Need to see Slot
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router'
import { createTables } from '../database/controller/dbController';
import "../global.css";
import { Suspense } from 'react';
import Fallback from '@/components/Fallback';

const RootLayout = () => {

  const createDbIfNeeded = async (db: SQLiteDatabase) => {
    console.log("Initializing database...");
    try {
      await createTables(db); // Call the function to create tables
      console.log("Tables created succesfully!");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Suspense fallback={<Fallback/>}>
      <SQLiteProvider databaseName='bitolj.db' onInit={createDbIfNeeded}>
        <Stack>
            <Stack.Screen name='index' options={{ headerShown: false }}/>
            <Stack.Screen name='(auth)' options={{ headerShown: false }}/>
            <Stack.Screen name='(tabs)' options={{ headerShown: false }}/>
        </Stack>
      </SQLiteProvider>
    </Suspense>
  )
}

export default RootLayout

const styles = StyleSheet.create({})