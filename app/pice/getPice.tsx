import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useState, useCallback, useEffect } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Pice } from '@/models/Pice';


// SHOW ALL PICE, CHOSEN PICE UPDATE OR DELETE
const getPice = () => {


    const database = useSQLiteContext();
    const [data, setData] = useState<Pice[]>([]);
    const [selectedRow, setSelectedRow] = useState<Pice | null>(null);
    const [naziv, setNaziv] = useState('');
    const [cena, setCena] = useState('');


    // READ
    const loadData = async () => {
        const result = await database.getAllAsync<Pice>("SELECT * FROM pice WHERE deleted = 'false';");
        setData(result);
      }
    // EVERY TIME PAGE LOADS WE NEED FUNCTION loadData to Load...
    useFocusEffect(
    useCallback( () => {
        loadData();
    }, [])
    );

    // CALLBACK FUNCTION THAT FIXES PICE OR NULL BUG
    useEffect(() => {
        if (selectedRow) {
            setNaziv(selectedRow.naziv);
            setCena(String(selectedRow.cena));
        } else {
            setNaziv('');
            setCena('');
        }
    }, [selectedRow]);


    // UPDATE
    const isNumeric = (value: string): boolean => {
        return /^[0-9]+$/.test(value);
    };
    const handleTypes = async () => {
        if(naziv == null || typeof naziv !== "string" || naziv == '' || cena == null || !isNumeric(cena)){
          Alert.alert(
            "Error",
            "Nepravilno uneti podaci.",
            [{ text: "OK" , style: 'cancel'}]
          );
        } else {
          Alert.alert(
            "Update Confirmation",
            "Da li želite da promenite Piće?",
            [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleUpdate()}]
          );
        }
      }
    const handleUpdate = async () => {
        if (!selectedRow) return;
            const updatedRow = {
                ...selectedRow,
                naziv: naziv.trim(),
                cena: Number(cena),
            };
            try {
                await database.runAsync("UPDATE pice SET deleted = 'true' WHERE id_pice = ?", [
                    updatedRow.id_pice,
                ]);
                await database.runAsync("INSERT INTO pice (naziv, cena, deleted) VALUES (?, ?, ?);", [
                    updatedRow.naziv, updatedRow.cena, "false"
                  ]);
                await loadData();
                Alert.alert("Success", "Piće uspešno ažurirano.");
            } catch (error) {
                console.error("Error updating Piće:", error);
            }
    }



    // DELETE
    const handleDelete = async () => {
        if (!selectedRow || !selectedRow.naziv || selectedRow.cena === 0) {
            return
        } else {
            Alert.alert(
                "Delete Confirmation",
                "Da li želite da izbrišete Piće?",
                [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => await deletePice()}]
              );
        }
    }

    const deletePice = async () => {
        if (!selectedRow || !selectedRow.id_pice) {
            console.log("Invalid selectedRow");
            return;
        }
        try {
            await database.runAsync("UPDATE pice SET deleted = 'true' WHERE id_pice = ?;", [Number(selectedRow.id_pice)])
            setSelectedRow(null);
            await loadData();
            Alert.alert("Success", "Piće uspešno izbrisano.");
        } catch (error) {
            console.log(error)
        }
    }

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
                    {selectedRow && (
                    <View className="mt-4">
                        <Text className="text-lg font-semibold">
                            Izabrano Piće: {selectedRow.naziv} - {selectedRow.cena} RSD
                        </Text>
                        <View className='w-full flex-row justify-center mt-3'>
                            <TouchableOpacity 
                            className='mt-4 bg-orange mx-2 items-center w-1/4 rounded-md py-4 px-4'
                            onPress={async () => handleTypes()}
                            >
                                <Text>Promeni Piće</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                            className='mt-4 bg-red-500 mx-2 items-center w-1/4 rounded-md py-4 px-4'
                            onPress={async () => handleDelete()}
                            >
                                <Text>Izbriši Piće</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="mt-4 px-4 justify-center items-center">
                            <Text className='text-center'>Naziv</Text>
                            <TextInput
                                placeholder='Naziv'
                                value={naziv}
                                onChangeText={(text) => setNaziv(text)}
                                className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
                            />
                            <Text className='text-center mt-2'>Cena</Text>
                            <TextInput
                                placeholder='Cena'
                                value={cena}
                                onChangeText={(text) => setCena(text)}
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

export default getPice

