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
    if (!selectedRow || !selectedRow.ime || !selectedRow.prezime || selectedRow.prezime === "admin") {
        Alert.alert("Delete Error", "Ne možete izbrisati Admina.")
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
                                <Text>Promeni Radnika</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                            className='mt-4 bg-red-500 mx-2 items-center w-1/3 rounded-md py-4 px-4'
                            onPress={async () => handleDelete()}
                            >
                                <Text>Izbriši Radnika</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="mt-4 px-4 justify-center items-center">
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