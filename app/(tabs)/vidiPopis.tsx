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
import  PdfGenerator  from '../../components/PdfGenerator';


const VidiPopis = () => {

  type Popis = {
    id_popis: number; datum: string; kuhinja: string; kuhinjaSt: string; ostalop: string;
    ostalopOpis: string; wolt: string; glovo: string; kartice: string; sale: string;
    ostalot: string; ostalotOpis: string; virman: string; virmanOpis: string;
    ukupno: string; smena: string; id_korisnik: number;
  };

  type Pice = {
    id_pice: number; naziv: string; cena: string;
    type: string; pocetno_stanje?: string; prodato?: string;
  };

  type Stavka_Popisa = {
    id_stavka_popisa: number; id_popis: number; pocetno_stanje: string;
    uneto: string; krajnje_stanje: string; prodato: string; ukupno: string; id_pice: number;
  };

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
  const [selectedPopis, setSelectedPopis] = useState<Popis | null>(null);
  const [dataPice, setDataPice] = useState<Pice[]>([]);
  const [dataStavka, setDataStavka] = useState<Stavka_Popisa[]>([])
  const [korisnici, setKorisnici] = useState<{ id_korisnik: number; ime: string; prezime: string }[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);


  const printConfirm = () => {
    Alert.alert(
      "Print confirm",
      "Da li želite da konvertujete ovaj popis u PDF??",
      [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: () => handlePDFPrint()}]
    );
  }

  const handlePDFPrint = () => {
    if (selectedPopis && dataStavka.length > 0) {
      setIsModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const loadData = async () => {
    try{
      const popisResult = await database.getAllAsync<Popis>("SELECT * FROM popis ORDER BY id_popis DESC");
      setData(popisResult);
  
      const piceResult = await database.getAllAsync<Pice>("SELECT * FROM pice");
      setDataPice(piceResult);

      const korisnikResult = await database.getAllAsync<{ id_korisnik: number; ime: string; prezime: string }>("SELECT * FROM korisnik");
      setKorisnici(korisnikResult);
    } catch (error) {
      console.error("Error loading data: " + error)
    }
  }

  const loadStavke = async (popisId: number) => {
    if (popisId === undefined) return;
    try {
      const selectedPopisData = data.find(p => p.id_popis === popisId);
      if (selectedPopisData) {
        const datum = selectedPopisData.datum;
        const smena = selectedPopisData.smena;
  
        // console.log('Selected Popis Data: ', selectedPopisData);
        // console.log('Datum: ', datum);
        // console.log('Smena: ', smena);
  
        if (datum && smena) {
          let formattedDatum: string;
          if (typeof datum === "string") {
            formattedDatum = datum;
          } else {
            console.error("Invalid datum format:", datum);
            return;
          }
  
          // console.log('Formatted Datum:', formattedDatum);
          // console.log('Popis ID:', popisId);
  
          const stavkaResult = await database.getAllAsync<Stavka_Popisa>(
            `SELECT sp.* 
             FROM stavka_popisa sp 
             JOIN popis p ON sp.id_popis = p.id_popis 
             WHERE p.id_popis = ? 
             AND p.datum = ? 
             AND p.smena = ?;`,
            [popisId, formattedDatum, smena]
          );
  
          // console.log('Stavka Result:', stavkaResult);
          setDataStavka(stavkaResult);
        } else {
          console.warn("Missing datum or smena in selectedPopisData");
          setDataStavka([]);
        }
      }
    } catch (error) {
      console.error("Error loading stavke: " + error);
      setDataStavka([]); 
    }
  };

  const evaluateExpression = (expression: string): string => {
    try {
      // If the expression is just a number, return it directly
      if (!expression.includes("+") && !expression.includes("-") && !expression.includes("*") && !expression.includes("/")) {
        return expression || "0";
      }
      // Safely evaluate the mathematical expression
      return new Function(`return ${expression}`)();
    } catch {
      return "0"; // Fallback in case of an invalid expression
    }
  };


  interface HandlePDFPrintProps {
    selectedPopis: Popis | null;
    dataStavka: Stavka_Popisa[];
  }

  useFocusEffect(
    useCallback(() => {
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
            <AntDesign name="logout" size={42} color="#AA0000" />
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
                  // console.log(dataStavka)
                }
                }}
              >
                <Picker.Item label="[Izaberite datum]" value="" />
                {data.map((popis) => (
                  <Picker.Item
                    key={popis.id_popis}
                    label={`${popis.datum.toString()} - ${korisnici.find(k => k.id_korisnik === popis?.id_korisnik)?.ime || "Nepoznato Ime"} [${popis.smena} smena]`}
                    value={popis.id_popis}
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              className={`ml-2 px-6 py-4 rounded ${
                selectedPopis ? "bg-orange" : "bg-gray-400 text-primary"
              }`}
              onPress={printConfirm}
              disabled={!selectedPopis}
            >
              <Text className="text-white font-bold">Štampaj Popis</Text>
            </TouchableOpacity>
            {selectedPopis && (
              <PdfGenerator
                visible={isModalVisible}
                onClose={handleCloseModal}
                title={korisnici.find(k => k.id_korisnik === selectedPopis?.id_korisnik)?.ime || "Nepoznato Ime"}
                dataStavka={dataStavka}
                dataPopis={selectedPopis}
                dataPice={dataPice}
              />
            )}
          </View>
        
          {selectedPopis && (
            <View className="w-full bg-white shadow-md">
              <View className="flex flex-row border-b px-2 bg-secondary">
                <Text className="flex-1 text-center text-primary font-bold text-xl py-2">
                  {`${korisnici.find(k => k.id_korisnik === selectedPopis?.id_korisnik)?.ime || "Nepoznato Ime"} ${korisnici.find(k => k.id_korisnik === selectedPopis?.id_korisnik)?.prezime || "Nepoznat Prezime"} | ${selectedPopis.smena === "prva" ? "Prva smena" : "Druga smena"}\n${selectedPopis.datum.toString()}`}
                </Text>
              </View>
              <View className="flex flex-row border-b bg-secondary">
                <Text className="flex-1 text-center text-orange font-bold text-xl py-2">
                  Stavke Popisa
                </Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Header */}
                  <View className="flex-row border-b bg-secondary">
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Naziv</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Početak</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Uneto</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Kraj</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Prodato</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Cena</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Ukupno</Text>
                  </View>

                  {/* Rows */}
                  {dataStavka.map((stavka) => {
                    const matchingPice = dataPice.find((pice) => pice.id_pice === stavka.id_pice);
                    return (
                      <View
                        key={stavka.id_stavka_popisa}
                        className="flex-row border-b items-center justify-center"
                      >
                        <Text className="w-32 text-center text-lg text-gray-700 py-2">
                          {matchingPice?.naziv || 'N/A'}
                        </Text>
                        <Text className="w-32 text-center text-lg text-gray-700 py-2">
                          {stavka.pocetno_stanje || 'N/A'}
                        </Text>
                        <Text 
                          className="w-32 text-center text-lg text-gray-700 py-2"
                          onPress={() => {
                            const expression = stavka.uneto || 'N/A';
                            Alert.alert('Izraz', `Sabirak: ${expression}`);
                          }}>
                          {evaluateExpression(stavka.uneto) || 'N/A'}
                        </Text>
                        <Text
                          className="w-32 text-center text-lg text-gray-700 py-2"
                          onPress={() => {
                            const expression = stavka.krajnje_stanje || 'N/A';
                            Alert.alert('Izraz', `Sabirak: ${expression}`);
                          }}
                        >
                          {evaluateExpression(stavka.krajnje_stanje) || '0'}
                        </Text>
                        <Text className="w-32 text-center text-lg text-gray-700 py-2">
                          {stavka.prodato || 'N/A'}
                        </Text>
                        <Text className="w-32 text-center text-lg text-gray-700 py-2">
                          {matchingPice?.cena || 'N/A'}
                        </Text>
                        <Text className="w-32 text-center text-lg font-bold text-secondary py-2">
                          {stavka.ukupno || 'N/A'} din
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

        {selectedPopis && (
          <>
            {/* First Table: Prihodi */}
            <View className="w-full bg-white ">
              <View className="flex flex-row border-b bg-secondary">
                <Text className="flex-1 text-center text-green-600 text-xl font-bold py-2">Prihodi</Text>
              </View>
              <View className="flex flex-row border-b bg-secondary">
                <Text className="flex-1 text-center text-white text-lg font-bold py-2">Kuhinja</Text>
                <Text className="flex-1 text-center text-white text-lg font-bold py-2">KS</Text>
                <Text className="flex-1 text-center text-white text-lg font-bold py-2">Ostali Prihodi</Text>
                <Text className="flex-1 text-center text-white text-lg font-bold py-2">Ukupno</Text>
              </View>
              <View className="flex flex-row border-b">
                <Text className="flex-1 text-center text-lg text-gray-700 py-2">{selectedPopis.kuhinja} din</Text>
                <Text className="flex-1 text-center text-lg text-gray-700 py-2">{selectedPopis.kuhinjaSt} din</Text>
                <Text className="flex-1 text-center text-lg text-gray-700 py-2"
                  onPress={() => {
                    const expression = selectedPopis.ostalop || 'N/A';
                    Alert.alert('Izraz', `Sabirak: ${expression}`);
                  }}
                >
                  {evaluateExpression(selectedPopis.ostalop)} din        
                </Text>
                <Text className="flex-1 text-center font-bold text-lg text-secondary py-2">
                  {(parseFloat(selectedPopis.kuhinja) + parseFloat(selectedPopis.kuhinjaSt) + parseFloat(evaluateExpression(selectedPopis.ostalop))).toFixed(2)} din
                </Text>
              </View>
              {/* Description section for Prihodi */}
              <View className="flex flex-row bg-gray-100">
                <Text className="flex-1 text-center font-bold text-lg text-gray-600 py-2">Opis Ostalih Prihoda</Text>
              </View>
              <View className="flex flex-row">
                <Text className="flex-1 text-center text-lg text-gray-700 py-2">{selectedPopis.ostalopOpis || 'N/A'}</Text>
              </View>
            </View>

            {/* Second Table: Troškovi */}
            <View className="w-full bg-white rounded-3xl shadow-md">
              <View className="flex flex-row border-b bg-secondary">
                <Text className="flex-1 text-center text-red-600 font-bold text-xl py-2">Troškovi</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  <View className="flex-row justify-center items-center border-b bg-secondary">
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Wolt</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Glovo</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Sale</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Kartice</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Ostali Troškovi</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Virmani</Text>
                    <Text className="w-32 text-center text-white text-lg font-bold py-2">Ukupno</Text>
                  </View>

                  <View className="flex-row border-b">
                    <Text 
                      className="w-32 text-center text-gray-700 text-lg py-2"
                      onPress={() => {
                        const expression = selectedPopis.wolt || 'N/A';
                        Alert.alert('Izraz', `Sabirak: ${expression}`);
                      }}
                    >
                      {evaluateExpression(selectedPopis.wolt)} din
                    </Text>
                    <Text 
                      className="w-32 text-center text-gray-700 text-lg py-2"
                      onPress={() => {
                        const expression = selectedPopis.glovo || 'N/A';
                        Alert.alert('Izraz', `Sabirak: ${expression}`);
                      }}
                    >
                      {evaluateExpression(selectedPopis.glovo)} din
                    </Text>
                    <Text 
                      className="w-32 text-center text-gray-700 text-lg py-2"
                      onPress={() => {
                        const expression = selectedPopis.sale || 'N/A';
                        Alert.alert('Izraz', `Sabirak: ${expression}`);
                      }}
                    >
                      {evaluateExpression(selectedPopis.sale)} din
                    </Text>
                    <Text 
                      className="w-32 text-center text-gray-700 text-lg py-2"
                      onPress={() => {
                        const expression = selectedPopis.kartice || 'N/A';
                        Alert.alert('Izraz', `Sabirak: ${expression}`);
                      }}
                    >
                      {evaluateExpression(selectedPopis.kartice)} din
                    </Text>
                    <Text 
                      className="w-32 text-center text-gray-700 text-lg py-2"
                      onPress={() => {
                        const expression = selectedPopis.ostalot || 'N/A';
                        Alert.alert('Izraz', `Sabirak: ${expression}`);
                      }}
                    >
                      {evaluateExpression(selectedPopis.ostalot)} din
                    </Text>
                    <Text 
                      className="w-32 text-center text-gray-700 text-lg py-2"
                      onPress={() => {
                        const expression = selectedPopis.virman || 'N/A';
                        Alert.alert('Izraz', `Sabirak: ${expression}`);
                      }}
                    >
                      {evaluateExpression(selectedPopis.virman)} din
                    </Text>
                    <Text className="w-32 text-center font-bold text-secondary text-lg py-2">
                      {(
                        parseFloat(evaluateExpression(selectedPopis.wolt)) +
                        parseFloat(evaluateExpression(selectedPopis.glovo)) +
                        parseFloat(evaluateExpression(selectedPopis.sale)) +
                        parseFloat(evaluateExpression(selectedPopis.kartice)) +
                        parseInt(evaluateExpression(selectedPopis.ostalot)) +
                        parseInt(evaluateExpression(selectedPopis.virman))
                      ).toFixed(2)} din
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Description section for Troškovi - Unchanged */}
              <View className="flex flex-col">
                <View className="flex flex-row bg-gray-100">
                  <Text className="flex-1 text-center font-bold text-gray-600 text-lg py-2">Opis Ostalih Troškova</Text>
                  <Text className="flex-1 text-center font-bold text-gray-600 text-lg py-2">Opis Virmana</Text>
                </View>
                <View className="flex flex-row">
                  <Text className="flex-1 text-center text-gray-700 text-lg py-2">{selectedPopis.ostalotOpis || 'N/A'}</Text>
                  <Text className="flex-1 text-center text-gray-700 text-lg py-2">{selectedPopis.virmanOpis || 'N/A'}</Text>
                </View>
              </View>
            </View>

            <View className="flex flex-row justify-center rounded-lg bg-white mt-4">
              <Text className="text-2xl font-bold text-right">
                Piće:{" "}
                {dataStavka
                  .reduce((sum, stavka) => sum + parseFloat(stavka.ukupno), 0)
                  .toFixed(2)}{" "}
                din
                {"   "}
                <Text className="text-green-600 font-bold">
                  Za predaju:{" "}
                  {(
                    dataStavka.reduce((sum, stavka) => sum + parseFloat(stavka.ukupno || "0"), 0) +
                    parseFloat(selectedPopis.kuhinja || "0") +
                    parseFloat(selectedPopis.kuhinjaSt || "0") +
                    parseFloat(evaluateExpression(selectedPopis.ostalop) || "0") -
                    (parseFloat(evaluateExpression(selectedPopis.wolt) || "0") +
                    parseFloat(evaluateExpression(selectedPopis.glovo) || "0") +
                    parseFloat(evaluateExpression(selectedPopis.sale) || "0") +
                    parseFloat(evaluateExpression(selectedPopis.kartice) || "0") +
                    parseFloat(evaluateExpression(selectedPopis.ostalot) || "0") +
                    parseFloat(evaluateExpression(selectedPopis.virman) || "0"))
                  ).toFixed(2)} din
                </Text>
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