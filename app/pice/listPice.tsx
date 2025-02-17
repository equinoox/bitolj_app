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
    
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );
    
    return (
        <SafeAreaView className='h-full bg-primary'>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="mt-4 px-6 mx-auto w-full max-w-2xl">
                    {/* Table Header */}
                    <View className="flex-row justify-between border-b-2 border-black pb-3 mb-4">
                        <Text className="text-lg font-bold flex-1 text-center">Naziv</Text>
                        <Text className="text-lg font-bold flex-1 text-center">Cena</Text>
                        <Text className="text-lg font-bold flex-1 text-center">Tip</Text>
                    </View>
                    
                    {/* Table Data */}
                    {data.map((item) => (
                        <TouchableOpacity
                            key={item.id_pice}
                            className={`flex-row justify-between items-center border-b border-gray-300 py-3 ${
                                selectedRow?.id_pice === item.id_pice ? "bg-orange" : ""
                            }`}
                            onPress={() => setSelectedRow(item)}
                        >
                            {/* Left side: Naziv */}
                            <Text className="flex-1 text-center">{item.naziv}</Text>
                            
                            {/* Center: Cena */}
                            <Text className="flex-1 text-center">{item.cena} RSD</Text>
                            
                            {/* Right side: Tip */}
                            <Text className="flex-1 text-center">
                                {item.type === 'piece' && 'Komad'}
                                {item.type === 'liters' && 'Mililitar'}
                                {item.type === 'kilograms' && 'Gram'}
                                {item.type === 'other' && 'Ostalo'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}


export default listaPice
