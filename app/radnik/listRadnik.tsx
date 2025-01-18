import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import { useState, useCallback } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Korisnik } from '@/models/Korisnik';
import React from 'react'

const listRadnik = () => {

  const database = useSQLiteContext();
  const [data, setData] = useState<Korisnik[]>([]);
  const [selectedRow, setSelectedRow] = useState<Korisnik>();
  const loadData = async () => {
      const result = await database.getAllAsync<Korisnik>("SELECT * FROM korisnik WHERE deleted = 'false'; ");
      setData(result);
    }
  // EVERY TIME PAGE LOADS WE NEED FUNCTION loadData to Load...
  useFocusEffect(
  useCallback( () => {
      loadData();
  }, [])
  );

  return (
      <SafeAreaView className='h-full flex bg-primary'>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="mt-4 px-4">
                <View className="flex-row justify-between border-b-2 border-black pb-2 mb-2">
                  <View className="flex-row flex-[2]">
                    <Text className="text-lg font-bold mr-4">Ime - Prezime</Text>
                  </View>
                  <Text className="text-lg font-bold flex-1 text-right">Pozicija</Text>
                </View>
                {data.map((item) => (
                    <TouchableOpacity
                        key={item.id_korisnik}
                        className={`flex-row justify-between border-b border-gray-300 py-2 ${
                        selectedRow?.id_korisnik === item.id_korisnik ? "bg-orange" : ""
                        }`}
                        onPress={() => setSelectedRow(item)}
                    >
                      <View className="flex-row flex-[2]">
                        <Text className="mr-4">{item.ime}</Text>
                        <Text>{item.prezime}</Text>
                      </View>
                      <Text className="flex-1 text-right">{item.role === "admin" ? "Admin" : item.role === "user" ? "Radnik" : item.role}</Text>
                    </TouchableOpacity>
                   ))}
                </View>
        </ScrollView>
      </SafeAreaView> 
  )
}

export default listRadnik