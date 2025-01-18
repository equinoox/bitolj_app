import React from 'react'
import { router } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useCallback } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Popis } from '@/models/Popis';
import { StavkaPopisa } from '@/models/StavkaPopisa';
import { Pice } from '@/models/Pice';

const VidiPopis = () => {
  const { userData, setUserData } = useAuth();
  const logoutConfirm = () => {
    Alert.alert(
      "Log Out",
      "Da li želite da se odjavite?",
      [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => logout()}]
    );
  }

  const logout = async () => {
    try{
      await setUserData(null);
      router.replace('/log-in');
    } catch (error) {
      console.error("Error: " + error)
    }
  };
  const currentDate = new Date().toLocaleDateString('sr-RS', {
    // weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const database = useSQLiteContext();
  const [data, setData] = useState<Popis[]>([]);
  const [dataPice, setDataPice] = useState<Pice[]>([]);
  const [dataStavka, setDataStavka] = useState<StavkaPopisa[]>([])
  const [selectedPopis, setSelectedPopis] = useState<Popis | null>(null);

  const loadData = async () => {
    try{
      const popisResult = await database.getAllAsync<Popis>("SELECT * FROM popis");
      setData(popisResult);
  
      const piceResult = await database.getAllAsync<Pice>("SELECT * FROM pice");
      setDataPice(piceResult);
    } catch (error) {
      console.error("Error loading data: " + error)
    }
  }

  const loadStavke = async (popisId: number) => {
    if (popisId === undefined) return;
    try {
      // Get the selected popis to access its date and smena
      const selectedPopisData = data.find(p => p.id_popis === popisId);
      if (selectedPopisData) {
        // Ensure selectedPopisData.datum and selectedPopisData.smena are defined
        const datum = selectedPopisData.datum;
        const smena = selectedPopisData.smena;

        if (datum && smena) {
            // Convert datum (Date) to string in the format YYYY-MM-DD
            let formattedDatum: string;

            if (typeof datum === "string") {
              formattedDatum = datum;
            } else if (datum instanceof Date) {
                formattedDatum = datum.toISOString().split("T")[0];
            } else {
                console.error("Invalid datum format:", datum);
                return;
            }
            const stavkaResult = await database.getAllAsync<StavkaPopisa>(
                `SELECT sp.* 
                 FROM stavka_popisa sp 
                 JOIN popis p ON sp.id_popis = p.id_popis 
                 WHERE p.id_popis = ? 
                 AND DATE(p.datum) = DATE(?) 
                 AND p.smena = ?;`,
                [popisId, formattedDatum, smena]
            );

            setDataStavka(stavkaResult);
        } else {
            console.warn("Missing datum or smena in selectedPopisData");
            setDataStavka([]);
        }
    }
    } catch (error) {
      console.error("Error loading stavke: " + error);
      setDataStavka([]); // Clear stavke on error
    }
  };


  useFocusEffect(
    useCallback( () => {
        loadData();
    }, [])
    );
  
  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ flexGrow: 1}}>
        {/* Header */}
        <View className="flex bg-secondary rounded-3xl m-4 p-4">
          {/* Logout Button */}
          <TouchableOpacity
            className="absolute top-4 right-4 bg-secondary rounded-md items-center"
            onPress={logoutConfirm}
          >
            <AntDesign name="logout" size={36} color="#AA0000" />
          </TouchableOpacity>

          {/* Icon and Info Row */}
          <View className="flex flex-row items-center justify-evenly">
            {/* Person Icon and Title */}
            <View className="flex mb-2 items-center space-y-2">
              <FontAwesome5 name="user" size={48} color="#FFA500" />
              <Text className="text-2xl mt-2 font-bold text-white">{userData?.ime} {userData?.prezime}</Text>
            </View>

            {/* Clock Icon and Date */}
            <View className="flex items-center space-y-2">
              <MaterialIcons name="access-time" size={48} color="#FFA500" />
              <View className="items-center">
                <Text className="text-xl text-white">Današnji Datum</Text>
                <Text className="text-xl text-white">{currentDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}

        <View className="m-4">
          <View className="flex flex-row justify-center items-center mb-4">
            <Text className="text-lg font-bold text-black mx-2">Izaberite Popis:</Text>
            <View className="border border-gray-300 rounded w-1/2">
              <Picker
                selectedValue={selectedPopis?.id_popis || ""}
                onValueChange={(itemValue) => {
                  const selected = data.find((popis) => popis.id_popis === itemValue);
                  setSelectedPopis(selected || null);
                if (selected?.id_popis !== undefined) {
                  loadStavke(selected.id_popis);
                }
                }}
              >
                <Picker.Item label="[Izaberite datum]" value="" />
                {data.map((popis) => (
                  <Picker.Item
                    key={popis.id_popis}
                    label={`${popis.datum.toString()} [${popis.smena} smena]`}
                    value={popis.id_popis}
                  />
                ))}
              </Picker>
            </View>
          </View>
        

        {selectedPopis && (
          <View className="w-full bg-white shadow-md">
            <View className="flex flex-row border-b  bg-secondary">
              <Text className="flex-1 text-center text-orange font-bold py-2">
                Stavke Popisa
              </Text>
            </View>
            {/* Header */}
            <View className="flex flex-row border-b bg-secondary">
              <Text className="flex-1 text-center text-white font-bold py-2">Naziv</Text>
              <Text className="flex-1 text-center text-white font-bold py-2">Početak</Text>
              <Text className="flex-1 text-center text-white font-bold py-2">Uneto</Text>
              <Text className="flex-1 text-center text-white font-bold py-2">Kraj</Text>
              <Text className="flex-1 text-center text-white font-bold py-2">Cena</Text>
              <Text className="flex-1 text-center text-white font-bold py-2">Ukupno</Text>
            </View>
    
            {/* Rows */}
            {dataStavka.map((stavka) => {
                const matchingPice = dataPice.find((pice) => pice.id_pice === stavka.id_pice);
                return (
                  
                  <View
                    key={stavka.id_stavka_popisa}
                    className="flex flex-row border-b"
                  >
                    <Text className="flex-1 text-center text-gray-700 py-2">
                      {matchingPice ? matchingPice.naziv : "Izbrisano piće"}
                    </Text>
                    <Text className="flex-1 text-center text-gray-700 py-2">
                      {stavka.pocetno_stanje}
                    </Text>
                    <Text className="flex-1 text-center text-gray-700 py-2">
                      {stavka.uneto || "0"}
                    </Text>
                    <Text className="flex-1 text-center text-gray-700 py-2">
                      {stavka.krajnje_stanje}
                    </Text>
                    <Text className="flex-1 text-center text-gray-700 py-2">
                      {matchingPice ? `${matchingPice.cena} din` : "N/A"}
                    </Text>
                    <Text className="flex-1 text-center font-bold text-secondary py-2">
                      {matchingPice 
                        ? (matchingPice.naziv === "Espresso"
                            ? Math.abs(
                                (stavka.pocetno_stanje + (stavka.uneto || 0) - stavka.krajnje_stanje) * matchingPice.cena
                              ).toFixed(2)
                            : ((stavka.pocetno_stanje + (stavka.uneto || 0) - stavka.krajnje_stanje) * matchingPice.cena).toFixed(2))
                        : "N/A"} din
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
         
         {selectedPopis && (
            <>
              {/* First Table: Prihodi */}
              <View className="w-full bg-white ">
                <View className="flex flex-row border-b bg-secondary">
                  <Text className="flex-1 text-center text-green-600 font-bold py-2">Prihodi</Text>
                </View>
                <View className="flex flex-row border-b bg-secondary">
                  <Text className="flex-1 text-center text-white font-bold py-2">Kuhinja</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">KS</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Ostali Prihodi</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Ukupno</Text>
                </View>
                <View className="flex flex-row border-b">
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.kuhinja} din</Text>
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.kuhinjaSt} din</Text>
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.ostalop} din</Text>
                  <Text className="flex-1 text-center font-bold text-secondary py-2">
                    {(selectedPopis.kuhinja + selectedPopis.kuhinjaSt + selectedPopis.ostalop).toFixed(2)} din
                  </Text>
                </View>
                {/* Description section for Prihodi */}
                <View className="flex flex-row bg-gray-100">
                  <Text className="flex-1 text-center font-bold text-gray-600 py-2">Opis Ostalih Prihoda</Text>
                </View>
                <View className="flex flex-row">
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.ostalopOpis || 'N/A'}</Text>
                </View>
              </View>

              {/* Second Table: Troškovi */}
              <View className="w-full bg-white rounded-lg shadow-md">
                <View className="flex flex-row border-b bg-secondary">
                  <Text className="flex-1 text-center text-red-600 font-bold py-2">Troškovi</Text>
                </View>
                <View className="flex flex-row justify-center items-center border-b bg-secondary">
                  <Text className="flex-1 text-center text-white font-bold py-2">Wolt</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Glovo</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Sale</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Kartice</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Ostali Troškovi</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Virmani</Text>
                  <Text className="flex-1 text-center text-white font-bold py-2">Ukupno</Text>
                </View>
                <View className="flex flex-row border-b">
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.wolt} din</Text>
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.glovo} din</Text>
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.sale} din</Text>
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.kartice} din</Text>
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.ostalot} din</Text>
                  <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.virman} din</Text>
                  <Text className="flex-1 text-center font-bold text-secondary py-2">
                    {(selectedPopis.wolt + selectedPopis.glovo + selectedPopis.sale + selectedPopis.kartice + selectedPopis.ostalot).toFixed(2)} din
                  </Text>
                </View>
                {/* Description section for Troškovi */}
                <View className="flex flex-col">
                  <View className="flex flex-row bg-gray-100">
                    <Text className="flex-1 text-center font-bold text-gray-600 py-2">Opis Ostalih Troškova</Text>
                    <Text className="flex-1 text-center font-bold text-gray-600 py-2">Opis Virmana</Text>
                  </View>
                  <View className="flex flex-row">
                    <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.ostalotOpis || 'N/A'}</Text>
                    <Text className="flex-1 text-center text-gray-700 py-2">{selectedPopis.virmanOpis || 'N/A'}</Text>
                  </View>
                </View>
                
              </View>
              <View className="flex flex-row justify-center rounded-lg bg-white mt-4">
                    <Text className="text-2xl font-bold text-right">
                      Piće:{" "}
                      {dataStavka
                        .reduce((sum, stavka) => sum + (stavka.ukupno || 0), 0)
                        .toFixed(2)}{" "}
                      din
                      {"   "}
                      <Text className="text-green-600 font-bold">Ukupno za predaju: {selectedPopis.ukupno} din</Text>
                    </Text>
                  </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default VidiPopis