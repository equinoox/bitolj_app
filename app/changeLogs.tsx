import React from 'react'
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import { useState, useCallback } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { ChangeHistory } from '@/models/ChangeHistory';

const changeLogs = () => {

    const database = useSQLiteContext();
    const [data, setData] = useState<ChangeHistory[]>([]);
    const loadData = async () => {
        try {
          const result = await database.getAllAsync<ChangeHistory>(
            `SELECT ch.id, 
                    k.ime AS korisnik_name,
                    k.prezime AS korisnik_surname,
                    p.naziv AS pice_name, 
                    ch.old_value, 
                    ch.new_value, 
                    ch.timestamp 
             FROM change_history ch
             JOIN korisnik k ON ch.id_korisnik = k.id_korisnik
             JOIN pice p ON ch.id_pice = p.id_pice
             ORDER BY ch.timestamp DESC;`  
          );
          setData(result);
        } catch (error) {
          console.error("Error loading data:", error);
        }
      };

    // EVERY TIME PAGE LOADS WE NEED FUNCTION loadData to Load...
    useFocusEffect(
    useCallback( () => {
        loadData();
    }, [])
    );

  return (
    <SafeAreaView className="h-full flex bg-primary">
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mt-4 px-4">
        {/* Table Header */}
        <View className="flex-row items-center border-b-2 border-black pb-2 mb-2">
            <Text className="text-lg font-bold flex-1 text-center">Korisnik</Text>
            <Text className="text-lg font-bold flex-1 text-center">Piće</Text>
            <Text className="text-lg font-bold flex-1 text-center">Stara Vrednost</Text>
            <Text className="text-lg font-bold flex-1 text-center">Nova Vrednost</Text>
            <Text className="text-lg font-bold flex-1 text-center">Vreme</Text>
        </View>

        {/* Table Data */}
        {data.map((item) => (
            <View
            key={`${item.korisnik_name}-${item.pice_name}-${item.timestamp}`} 
            className={`flex-row items-center border-b border-gray-400 py-2`}
            >
            <Text className="flex-1 text-center">{item.korisnik_name}  {item.korisnik_surname}</Text>
            <Text className="flex-1 text-center">{item.pice_name}</Text>
            <Text className="flex-1 text-center">{item.old_value}</Text>
            <Text className="flex-1 text-center">{item.new_value}</Text>
            <Text className="flex-1 text-center">{item.timestamp}</Text>
            </View>
        ))}
        </View>
    </ScrollView>
    </SafeAreaView>
  )
}

export default changeLogs