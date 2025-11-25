import { addAdmin, createTables, addPositionColumn, rollbackTables } from '../database/controller/dbController';
import { AuthProvider } from '../contexts/AuthContext';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router'
import { Suspense } from 'react';
import Fallback from '@/components/Fallback';
import { useEffect, useState, useRef } from 'react';
import "../global.css";

const RootLayout = () => {
  
  const createDbIfNeeded = async (db: SQLiteDatabase) => {
    try {
      await createTables(db);
      console.log("Database loaded succesfully!");
      await addAdmin(db);
      await addPositionColumn(db);
    } catch (error) {
      console.log(error);
    }
  }
  
  return (
    <Suspense fallback={<Fallback/>}>
      <AuthProvider>
          <SQLiteProvider databaseName="bitolj.db" onInit={createDbIfNeeded}>
            <Stack >
                <Stack.Screen name='index' options={{ headerShown: false }}/>
                <Stack.Screen name='(auth)' options={{ headerShown: false }}/>
                <Stack.Screen name='(tabs)' options={{ headerShown: false }}/>
                <Stack.Screen name='changeLogs' options={{ presentation: "modal", title: "Istorija Promena" }}/>
                <Stack.Screen name='db_manager' options={{ presentation: "modal", title: "Upravljanje Bazom" }}/>
                <Stack.Screen name='pice/getPice' options={{ presentation: "modal", title: "Promeni/Obriši Piće" }}/>
                <Stack.Screen name='pice/addPice' options={{ presentation: "modal", title: "Dodaj Piće" }}/>
                <Stack.Screen name='pice/listPice' options={{ presentation: "modal", title: "Lista Pića" }}/>
                <Stack.Screen name='radnik/getRadnik' options={{ presentation: "modal", title: "Promeni/Obriši Radnika" }}/>
                <Stack.Screen name='radnik/roleRadnik' options={{ presentation: "modal", title: "Promeni poziciju Radnika" }}/>
                <Stack.Screen name='radnik/passRadnik' options={{ presentation: "modal", title: "Promeni šifru Radnika" }}/>
                <Stack.Screen name='radnik/addRadnik' options={{ presentation: "modal", title: "Dodaj Radnika" }}/>
                <Stack.Screen name='radnik/listRadnik' options={{ presentation: "modal", title: "Lista Radnika" }}/>
            </Stack>
          </SQLiteProvider>
      </AuthProvider>
    </Suspense>
  )
}

export default RootLayout

