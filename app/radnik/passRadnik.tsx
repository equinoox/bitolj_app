import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useState, useCallback, useEffect } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Korisnik } from '@/models/Korisnik';
import React from 'react'

const passRadnik = () => {
    
    const database = useSQLiteContext();
    const [data, setData] = useState<Korisnik[]>([]);
    const [selectedRow, setSelectedRow] = useState<Korisnik | null>(null);
  
    const [sifra, setSifra] = useState("")
    const [cSifra, setCSifra] = useState("")
    
    // READ
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

    const handleTypes = async () => {
        if(selectedRow?.ime === "Aleksandar" && selectedRow?.prezime === "Milenković"){
            Alert.alert("Delete Error", "Ne možete promeniti šifru ovog admina.")
            return
          }
        if(sifra !== cSifra || sifra === "" || cSifra === ""){
          Alert.alert(
            "Error",
            "Ne poklapa se šifra.",
            [{ text: "OK" , style: 'cancel'}]
          );
        } else {
          Alert.alert(
            "Update Confirmation",
            "Da li želite da promenite šifru Radnika?",
            [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleUpdate()}]
          );
        }
      }

    const handleUpdate = async () => {
    if (!selectedRow) return;
        try {
            await database.runAsync("UPDATE korisnik SET sifra = ? WHERE id_korisnik = ?", [
                sifra, selectedRow.id_korisnik
            ]);
            await loadData();
            Alert.alert("Success", "Korisnik uspešno ažuriran. Resetujte aplikaciju kako bi se promene sačuvale.");
        } catch (error) {
            console.error("Error updating Korisnik:", error);
        }
    }

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

                {/* Selected Row Information */}
                {selectedRow && (
                    <View className="mt-6 w-full">
                        <Text className="text-lg font-semibold text-center">
                            Izabrani Radnik: {selectedRow.ime} {selectedRow.prezime}
                        </Text>
                        
                        {/* Action Buttons */}
                        <View className='w-full flex-row justify-center mt-4'>
                            <TouchableOpacity 
                                className='bg-orange mx-2 items-center w-1/3 rounded-md py-4'
                                onPress={handleTypes}
                            >
                                <Text>Izmeni</Text>
                            </TouchableOpacity>
                        </View>
                        <View className='mt-4 justify-center items-center'>
                        <Text className='text-center'>Nova šifra</Text>
                          <TextInput
                            keyboardType='number-pad'
                            placeholder='Nova šifra'
                            value={sifra}
                            onChangeText={(text) => setSifra(text)}
                            className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
                          />
                          <Text className='text-center mt-2'>Potvrdi šifru</Text>
                          <TextInput
                            keyboardType='number-pad'
                            placeholder='Potvrdi šifru'
                            value={cSifra}
                            onChangeText={(text) => setCSifra(text)}
                            className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
                          />
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    </SafeAreaView>
  )
}

export default passRadnik