import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useState, useCallback, useEffect } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Korisnik } from '@/models/Korisnik';
import React from 'react'

const getRadnik = () => {

  const database = useSQLiteContext();
  const [data, setData] = useState<Korisnik[]>([]);
  const [selectedRow, setSelectedRow] = useState<Korisnik | null>(null);

  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  
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
        setIme(selectedRow.ime);
        setPrezime(selectedRow.prezime);
    } else {
        setIme('');
        setPrezime('');
    }
  }, [selectedRow]);

  // UPDATE
  const isLettersAndSymbols = (value: string): boolean => {
    return /^[a-zA-ZćčžšđĆČŽŠĐ!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\]*$/.test(value);
  }; 
  const handleTypes = async () => {
    if(selectedRow?.ime === "Aleksandar" && selectedRow?.prezime === "Milenković"){
      Alert.alert("Delete Error", "Ne možete promeniti ovog admina.")
      return
    }
    if(ime == null || typeof ime !== "string" || ime == '' || prezime == null || typeof prezime !== "string" || prezime == '' || !isLettersAndSymbols(ime) || !isLettersAndSymbols(prezime)){
      Alert.alert(
        "Error",
        "Nepravilno uneti podaci.",
        [{ text: "OK" , style: 'cancel'}]
      );
    } else {
      Alert.alert(
        "Update Confirmation",
        "Da li želite da promenite Radnika?",
        [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleUpdate()}]
      );
    }
  }

  const handleUpdate = async () => {
    if (!selectedRow || selectedRow.ime === "admin"){
      Alert.alert("Update Error", "Ne možete promeniti Admina.")
      return
    } 
        const updatedRow = {
            ...selectedRow,
            ime: ime.trim(),
            prezime: prezime.trim(),
        };
        try {
            await database.runAsync("UPDATE korisnik SET deleted = 'true' WHERE id_korisnik = ?", [
                updatedRow.id_korisnik,
            ]);
            await database.runAsync("INSERT INTO korisnik (ime, prezime, sifra, role, deleted) VALUES (?, ?, ?, ?, ?);", [
              updatedRow.ime, updatedRow.prezime, selectedRow.sifra, selectedRow.role, 'false'
            ]);
            setSelectedRow(null);
            await loadData();
            Alert.alert("Success", "Korisnik uspešno ažuriran. Resetujte aplikaciju kako bi se promene sačuvale.");
        } catch (error) {
            console.error("Error updating Korisnik:", error);
        }
  }


  // DELETE
  const handleDelete = async () => {
    if(selectedRow?.ime === "Aleksandar" && selectedRow?.prezime === "Milenković"){
      Alert.alert("Delete Error", "Ne možete izbrisati ovog admina.")
      return
    }
    if (!selectedRow || !selectedRow.ime || !selectedRow.prezime) {
        Alert.alert("Delete Error", "Niste izabrali polje.")
        return
    } else {
        Alert.alert(
            "Delete Confirmation",
            "Da li želite da izbrišete Korisnika?",
            [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => await deleteKorisnik()}]
          );
    }
  }

  const deleteKorisnik = async () => {
    if (!selectedRow || !selectedRow.id_korisnik) {
        console.log("Invalid selectedRow");
        return;
    }
    try {
        await database.runAsync("UPDATE korisnik SET deleted = 'true' WHERE id_korisnik = ?;", [Number(selectedRow.id_korisnik)])
        setSelectedRow(null);
        await loadData();
        Alert.alert("Success", "Korisnik uspešno izbrisan. Resetujte aplikaciju kako bi se promene sačuvale.");
    } catch (error) {
        console.log(error)
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
                            <TouchableOpacity 
                                className='bg-red-500 mx-2 items-center w-1/3 rounded-md py-4'
                                onPress={handleDelete}
                            >
                                <Text>Izbriši</Text>
                            </TouchableOpacity>
                        </View>
                        <View className='mt-4 justify-center items-center'>
                        <Text className='text-center'>Ime</Text>
                        <TextInput
                          placeholder='Ime'
                          value={ime}
                          onChangeText={(text) => setIme(text)}
                          className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
                        />
                        <Text className='text-center mt-2'>Prezime</Text>
                        <TextInput
                          placeholder='Prezime'
                          value={prezime}
                          onChangeText={(text) => setPrezime(text)}
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

export default getRadnik