import React from 'react'
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import { useState, useCallback } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Pice } from '@/models/Pice';

const listaPice = () => {

    const database = useSQLiteContext();
    const [data, setData] = useState<Pice[]>([]);
    const [selectedRow, setSelectedRow] = useState<Pice>();
    const loadData = async () => {
        const result = await database.getAllAsync<Pice>("SELECT * FROM pice WHERE deleted = 'false'");
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
                    <Text className="text-lg font-bold">Naziv</Text>
                    <Text className="text-lg font-bold">Cena</Text>
                </View>
                {data.map((item) => (
                    <TouchableOpacity
                        key={item.id_pice}
                        className={`flex-row justify-between border-b border-gray-300 py-2 ${
                        selectedRow?.id_pice === item.id_pice ? "bg-orange" : ""
                        }`}
                        onPress={() => setSelectedRow(item)}
                    >
                        <Text>{item.naziv}</Text>
                        <Text>{item.cena} RSD</Text>
                    </TouchableOpacity>
                   ))}
                </View>
        </ScrollView>
    </SafeAreaView>
  )
}

export default listaPice
