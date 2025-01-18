import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useState, useCallback, useEffect } from 'react'
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Korisnik } from '@/models/Korisnik';
import React from 'react'

const roleRadnik = () => {

    const database = useSQLiteContext();
    const [data, setData] = useState<Korisnik[]>([]);
    const [selectedRow, setSelectedRow] = useState<Korisnik | null>(null);
  
    const [role, setRole] = useState("")

    
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
  
    // CALLBACK FUNCTION
    useEffect(() => {
      if (selectedRow) {
          setRole(selectedRow.role);
      } else {
          setRole('');
      }
    }, [selectedRow]);

    const handleTypes = async () => {
        if(role == 'admin' || role == 'user'){
            Alert.alert(
                "Update Confirmation",
                "Da li želite da promenite poziciju Radnika?",
                [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleUpdate()}]
              );
        } else {
            Alert.alert(
                "Error",
                "Nepravilno izabrano polje.",
                [{ text: "OK" , style: 'cancel'}]
            );
        }
      }

      const handleUpdate = async () => {
        if (!selectedRow || selectedRow.ime === "admin" || selectedRow.prezime === "admin"){
          Alert.alert("Error", "Administratoru nije moguće menjati poziciju.");
          return
        } 
            try {
                await database.runAsync("UPDATE korisnik SET role = ? WHERE id_korisnik = ?", [
                    role, selectedRow.id_korisnik
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
                            Izabrani Radnik: {selectedRow.ime} - {selectedRow.prezime} - {selectedRow.role === "admin" ? "Admin" : selectedRow.role === "user" ? "Radnik" : selectedRow.role}
                        </Text>
                        <View className='w-full flex-row justify-center mt-3'>
                            <TouchableOpacity 
                            className='mt-4 bg-orange mx-2 items-center w-1/3 rounded-md py-4 px-4'
                            onPress={async () => handleTypes()}
                            >
                                <Text>Promeni Poziciju</Text>
                            </TouchableOpacity>   
                            <View className="w-52 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md ml-2 mt-3">
                                <Picker
                                    selectedValue={role}
                                    onValueChange={(itemValue) => setRole(itemValue)}
                                    style={{ height: 60, width: '100%' }}
                                    dropdownIconColor="#6B7280"
                                >
                                    <Picker.Item label="Admin" value="admin" />
                                    <Picker.Item label="Radnik" value="user" />
                                </Picker>
                           </View>
                        </View>
                    </View>
                  )}
                </View>
        </ScrollView>
    </SafeAreaView>
  )
}

export default roleRadnik