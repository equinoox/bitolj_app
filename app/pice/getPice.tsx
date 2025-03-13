import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useState, useCallback, useEffect } from 'react'
import { Picker } from '@react-native-picker/picker';
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
    const [type, setType] = useState('');
    const [position, setPosition] = useState('')

    const handleAddDot = () => {
        if (!cena.includes(".")) {
          setCena(cena + ".");
        }
      };


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
            setCena(selectedRow.cena.toString());
            setType(selectedRow.type);
            setPosition(selectedRow.position.toString())
        }
    }, [selectedRow]);


    // UPDATE
    const isNumeric = (value: string): boolean => {
        return /^\d+(\.\d+)?$/.test(value);
      };
    const handleTypes = async () => {
        if(naziv == null || typeof naziv !== "string" || naziv == '' || cena == null || !isNumeric(cena) || position == null){
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
                type: type,
                position: Number(position)
            };
            try {
                await database.runAsync("UPDATE pice SET deleted = 'true', position = NULL WHERE id_pice = ?", [
                    updatedRow.id_pice,
                ]);
                await database.runAsync("INSERT INTO pice (naziv, cena, position, type, deleted) VALUES (?, ?, ?, ?, ?);", [
                    updatedRow.naziv, updatedRow.cena, updatedRow.position, updatedRow.type, "false"
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
            await database.runAsync(
                "UPDATE pice SET deleted = 'true', position = NULL WHERE id_pice = ?;", 
                [Number(selectedRow.id_pice)]
              );
            setSelectedRow(null);
            await loadData();
            Alert.alert("Success", "Piće uspešno izbrisano.");
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <SafeAreaView className='h-full flex bg-primary'>
            <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{ flexGrow: 1 }}>
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
                        <TouchableOpacity
                            key={item.id_pice}
                            className={`flex-row justify-between border-b border-gray-300 py-3 ${
                                selectedRow?.id_pice === item.id_pice ? "bg-orange" : ""
                            }`}
                            onPress={() => setSelectedRow(item)}
                        >
                            <Text className="flex-1 text-center">{item.naziv}</Text>
                            <Text className="flex-1 text-center">{item.cena} RSD</Text>
                            <Text className="flex-1 text-center">
                                {item.type === 'piece' && 'Komad'}
                                {item.type === 'liters' && 'Mililitar'}
                                {item.type === 'kilograms' && 'Gram'}
                                {item.type === 'other' && 'Ostalo'}
                            </Text>
                            <Text className="flex-1 text-center">{item.position !== null ? `${item.position}` : 'N/A'}</Text>
                        </TouchableOpacity>
                    ))}
    
                    {/* Selected Item Form */}
                    {selectedRow && (
                        <View className="mt-6 w-full">
                            <Text className="text-lg font-semibold text-center">
                                Izabrano Piće: {selectedRow.naziv} - {selectedRow.cena} RSD
                            </Text>
    
                            {/* Action Buttons */}
                            <View className='w-full flex-row justify-center mt-4'>
                                <TouchableOpacity 
                                    className='bg-orange mx-2 items-center w-1/3 rounded-md py-4'
                                    onPress={async () => handleTypes()}
                                >
                                    <Text>Promeni Piće</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    className='bg-red-500 mx-2 items-center w-1/3 rounded-md py-4'
                                    onPress={async () => handleDelete()}
                                >
                                    <Text>Izbriši Piće</Text>
                                </TouchableOpacity>
                            </View>
    
                            {/* Edit Form */}
                            <View className="mt-6 w-full items-center">
                                <View className="w-full max-w-md">
                                    <Text className='text-center font-medium text-gray-700 text-lg mb-2'>Naziv</Text>
                                    <TextInput
                                        placeholder='Naziv'
                                        value={naziv}
                                        onChangeText={(text) => setNaziv(text)}
                                        className='w-full mb-4 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
                                    />
    
                                    <Text className='text-center mt-2 text-lg font-medium text-gray-700'>Cena</Text>
                                    <View className="relative w-full mt-2">
                                        <TextInput
                                        placeholder='Cena'
                                        value={cena}
                                        keyboardType="number-pad"
                                        onChangeText={(text) => setCena(text)}
                                        className='w-full border border-gray-300 bg-white rounded-md p-3 text-gray-700 pr-12'
                                        />
                                        {/* Button inside the input */}
                                        <TouchableOpacity
                                        onPress={handleAddDot}
                                        className="absolute h-10 w-10 right-2 top-2 p-2 bg-gray-200 rounded-md"
                                        >
                                        <Text className="text-sm font-bold text-gray-600">.</Text>
                                        </TouchableOpacity>
                                    </View>
    
                                    <Text className='text-center text-lg my-2 font-medium text-gray-700'>Tip & Pozicija</Text>
                                    <View className="flex-row justify-center items-center mb-2 space-x-2">
                                    {/* Picker */}
                                    <View className="w-[40%] bg-white border border-gray-300 rounded-lg mr-2 overflow-hidden shadow-md">
                                        <Picker
                                        selectedValue={type}
                                        onValueChange={(itemValue) => setType(itemValue)}
                                        style={{ height: 60, width: '100%' }}
                                        dropdownIconColor="#6B7280"
                                        >
                                        <Picker.Item label="Komadno" value="piece" />
                                        <Picker.Item label="Mililitarsko" value="liters" />
                                        <Picker.Item label="Gramsko" value="kilograms" />
                                        <Picker.Item label="Ostalo" value="other" />
                                        </Picker>
                                    </View>

                                    {/* TextInput */}
                                    <TextInput
                                        value={position}
                                        onChangeText={setPosition}
                                        keyboardType="numeric"
                                        placeholder="Pozicija"
                                        className="w-[30%] h-[50px] border border-gray-300 rounded-lg px-4 bg-white shadow-md text-center"
                                    />
                                    </View>
                                    
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default getPice

