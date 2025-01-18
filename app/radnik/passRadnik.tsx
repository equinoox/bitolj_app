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
        if(sifra !== cSifra){
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
                      <Text className="flex-1 text-right">
                      {item.role === "admin" ? "Admin" : item.role === "user" ? "Radnik" : item.role}
                      </Text>
                    </TouchableOpacity>
                   ))}
                  {selectedRow && (
                    <View className="mt-4">
                        <Text className="text-lg font-semibold">
                            Izabrani Radnik: {selectedRow.ime} - {selectedRow.prezime} - {selectedRow.role === "admin" ? "Admin" : selectedRow.role === "user" ? "Radnik" : selectedRow.role} - {selectedRow.sifra}
                        </Text>
                        <View className='w-full flex-row justify-center mt-3'>
                            <TouchableOpacity 
                            className='mt-4 bg-orange mx-2 items-center w-1/3 rounded-md py-4 px-4'
                            onPress={async () => handleTypes()}
                            >
                                <Text>Promeni šifru</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="mt-4 px-4 justify-center items-center">
                          <Text className='text-center'>Nova šifra</Text>
                          <TextInput
                            placeholder='Nova šifra'
                            value={sifra}
                            onChangeText={(text) => setSifra(text)}
                            className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
                          />
                          <Text className='text-center mt-2'>Potvrdi šifru</Text>
                          <TextInput
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