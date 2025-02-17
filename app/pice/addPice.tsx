import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';

const AddPice = () => {
  const database = useSQLiteContext();
  const [naziv, setNaziv] = useState("");
  const [cena, setCena] = useState("");
  const [type, setType] = useState("piece");

  // CREATE
  const isNumeric = (value: string): boolean => {
    return /^\d+(\.\d+)?$/.test(value);
  };

  const handleTypes = async () => {
    if (naziv == null || typeof naziv !== "string" || naziv === '' || cena == null || !isNumeric(cena)) {
      Alert.alert(
        "Error",
        "Nepravilno uneti podaci.",
        [{ text: "OK", style: 'cancel' }]
      );
    } else {
      Alert.alert(
        "Adding Confirmation",
        "Da li želite da unesete Piće?",
        [{ text: "Ne", style: 'cancel' }, { text: "Da", onPress: async () => handleSave() }]
      );
    }
  };

  const handleSave = async () => {
    try {
      await database.runAsync("INSERT INTO pice (naziv, cena, type, deleted) VALUES (?, ?, ?, ?);", [
        naziv, cena, type, "false"
      ]);
      Alert.alert(
        "Adding Success",
      `Uspešno dodato Piće.`,
        [{ text: "OK", style: 'default' }]
      );
    } catch (error) {
      console.log(error);
    }
  };

  const clearInputs = async () => {
    setNaziv("");
    setCena("");
  };

  // Function to add "." to the Cena input
  const handleAddDot = () => {
    if (!cena.includes(".")) {
      setCena(cena + ".");
    }
  };

  return (
    <SafeAreaView className='h-full flex bg-primary'>
      <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mt-4 px-4 justify-center items-center">
          <Text className='text-center text-lg font-medium text-gray-700'>Naziv</Text>
          <TextInput
            placeholder='Naziv'
            value={naziv}
            onChangeText={(text) => setNaziv(text)}
            className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
          />

          <Text className='text-center mt-2 text-lg font-medium text-gray-700'>Cena</Text>
          <View className="relative w-3/4 mt-2">
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

          {/* Picker for the type */}
          <Text className='text-center mt-2 text-lg font-medium text-gray-700'>Tip</Text>
          <View className="w-2/6 mt-2 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
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

          <View className='w-full flex-row justify-around mt-3'>
            <TouchableOpacity
              className='mt-4 bg-orange items-center w-1/4 rounded-md py-4 px-4'
              onPress={async () => handleTypes()}
            >
              <Text className="text-black text-lg">Dodaj Piće</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className='mt-4 bg-red-500 items-center w-1/4 rounded-md py-4 px-4'
              onPress={async () => clearInputs()}
            >
              <Text className="text-black text-lg">Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddPice;