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
            <View className="mt-4 px-6 mx-auto w-full max-w-2xl">
                {/* Table Header */}
                <View className="flex-row justify-between items-center border-b-2 border-black pb-3 mb-4">
                    <View className="flex-row flex-[2]">
                        <Text className="text-lg font-bold">Ime - Prezime</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-center">Pozicija</Text>
                    </View>
                </View>

                {/* Table Data */}
                {data.map((item) => (
                    <TouchableOpacity
                        key={item.id_korisnik}
                        className={`flex-row justify-between items-center border-b border-gray-300 py-3 ${
                            selectedRow?.id_korisnik === item.id_korisnik ? "bg-orange" : ""
                        }`}
                        onPress={() => setSelectedRow(item)}
                    >
                        <View className="flex-row flex-[2]">
                            <Text className="text-base">{item.ime}</Text>
                            <Text className="text-base ml-2">{item.prezime}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base text-center">
                                {item.role === "admin" ? "Admin" : 
                                 item.role === "user" ? "Radnik" : 
                                 item.role === "manager" ? "Menadžer" : 
                                 item.role}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    </SafeAreaView>

  )
}

export default listRadnik