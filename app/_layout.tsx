import { AuthProvider } from '../contexts/AuthContext';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router'
import { addAdmin, createTables, rollbackTables } from '../database/controller/dbController';
import { Suspense } from 'react';
import Fallback from '@/components/Fallback';
import React, { useState } from 'react';
import "../global.css";


const RootLayout = () => {

  const createDbIfNeeded = async (db: SQLiteDatabase) => {
    console.log("Initializing database...");
    try {
      await createTables(db);
      console.log("Database loaded succesfully!");
      await addAdmin(db);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Suspense fallback={<Fallback/>}>
      <AuthProvider>
      <SQLiteProvider databaseName='bitolj.db' onInit={createDbIfNeeded}>
        <Stack >
            <Stack.Screen name='index' options={{ headerShown: false }}/>
            <Stack.Screen name='(auth)' options={{ headerShown: false }}/>
            <Stack.Screen name='(tabs)' options={{ headerShown: false }}/>
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

