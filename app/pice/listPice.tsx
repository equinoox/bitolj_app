import React from 'react'
import { Text, View, SafeAreaView, ScrollView } from 'react-native'
import { useState, useCallback } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Pice } from '@/models/Pice';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { SessionExpiredOverlay } from '../../components/SessionExpiredOverlay';
import { TouchableOpacityWithReset } from '../../components/TouchableOpacityWithReset';

const listaPice = () => {

    const { userData, isSessionExpired, setUserData, resetInactivityTimeout } = useAuth();
    const logout = async () => {
      try{
        await setUserData(null);
        router.replace('/log-in');
      } catch (error) {
        console.error("Error: " + error)
      }
    };

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
        <SafeAreaView className='h-full flex-1 bg-primary'>
            <View
                className="flex-1"
                onStartShouldSetResponder={() => {
                resetInactivityTimeout();
                return false;
            }}
            >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="mt-4 px-6 mx-auto w-full max-w-2xl">
                    {/* Table Header */}
                    <View className="flex-row justify-between border-b-2 border-black pb-3 mb-4">
                        <Text className="text-lg font-bold flex-1 text-center">Naziv</Text>
                        <Text className="text-lg font-bold flex-1 text-center">Cena</Text>
                        <Text className="text-lg font-bold flex-1 text-center">Tip</Text>
                        <Text className="text-lg font-bold flex-1 text-center">Pozicija</Text>
                    </View>
    
                    {/* Table Data */}
                    {data.map((item) => (
                        <TouchableOpacityWithReset
                            key={item.id_pice}
                            className={`flex-row justify-between items-center border-b border-gray-300 py-3 ${
                                selectedRow?.id_pice === item.id_pice ? "bg-orange" : ""
                            }`}
                            onPress={() => setSelectedRow(item)}
                        >
                            {/* Naziv */}
                            <Text className="flex-1 text-center">{item.naziv}</Text>
    
                            {/* Cena */}
                            <Text className="flex-1 text-center">{item.cena}</Text>
    
                            {/* Tip */}
                            <Text className="flex-1 text-center">
                                {item.type === 'piece' && 'Komad'}
                                {item.type === 'liters' && 'Mililitar'}
                                {item.type === 'kilograms' && 'Gram'}
                                {item.type === 'other' && 'Ostalo'}
                            </Text>
    
                            {/* Pozicija */}
                            <Text className="flex-1 text-center">
                                {item.position !== null ? `${item.position}` : 'N/A'}
                            </Text>
                        </TouchableOpacityWithReset>
                    ))}
                </View>
            </ScrollView>
            <SessionExpiredOverlay
                visible={isSessionExpired}
                onLogout={logout}
            />
            </View>
        </SafeAreaView>
    );
}


export default listaPice
