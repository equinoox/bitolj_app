import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert  } from 'react-native'
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import DialogModal from "../../components/DialogModal";
import { Pice } from '@/models/Pice';
import React from 'react'
import { StavkaPopisa } from '@/models/StavkaPopisa';

const Popis = () => {
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

  // DATE
  // ================================================================================================================
  // ================================================================================================================

  const currentDate = new Date().toLocaleDateString('sr-RS', {
    // weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const now = new Date();
  const serbianTimeString = new Intl.DateTimeFormat("sr-RS", {
    timeZone: "Europe/Belgrade",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  
  const [hour, minute] = serbianTimeString.split(":").map(Number);
  const isAfter16h = hour > 16 || (hour === 16 && minute >= 0);
  const isBefore16h = !isAfter16h; 

  // ================================================================================================================
  // ================================================================================================================

  // INTERFACES
  // ================================================================================================================
  // ================================================================================================================

  interface UserInput {
    uneto?: number;
    kraj?: number;
    inputString?: string;
    calculationString?: string;
  }

  interface AdditionalInputs {
    datum: Date;
    kuhinja: string;
    ks: string;
    ostalop: string;
    ostalopOpis: string;
    wolt: string;
    glovo: string;
    sale: string;
    kartice: string;
    ostalot: string;
    virman: string;
    ostalotOpis: string;
    virmanOpis: string;
    ukupnoAll: string;
    smena: string;
  }

  // ================================================================================================================
  // ================================================================================================================


  // USESTATE FOR USER INPUTS
  // ================================================================================================================
  // ================================================================================================================
  
  const [userInputs, setUserInputs] = useState<Record<number, UserInput>>({});
  
  const [additionalInputs, setAdditionalInputs] = useState<AdditionalInputs>({
    datum: now,
    kuhinja: '',
    ks: '',
    ostalop: '',
    ostalopOpis: '',
    wolt: '',
    glovo: '',
    sale: '',
    kartice: '',
    ostalot: '',
    virman: '',
    ostalotOpis: '',
    virmanOpis: '',
    ukupnoAll: '',
    smena: ''
  });
  
  const [dialogValue, setDialogValue] = useState<string>(""); 
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // ================================================================================================================
  // ================================================================================================================


  // DATABASE
  // ================================================================================================================
  // ================================================================================================================
 
  const database = useSQLiteContext();
  const [data, setData] = useState<Pice[]>([]);
  const [stavka, setStavka] = useState<StavkaPopisa[]>([]);

  const loadData = async () => {
    const result = await database.getAllAsync<Pice>("SELECT * FROM pice WHERE deleted = 'false'; ");
    setData(result);
  };

  const getLastPopisStavke = async () => {
    try {
      const result = await database.getAllAsync<StavkaPopisa>(`
        SELECT * FROM stavka_popisa WHERE id_popis = (SELECT MAX(id_popis) FROM popis);
      `);
      setStavka(result);
    } catch (error) {
      console.error("Error fetching stavka_popisa for the last popis:", error);
    }
  };

  // ================================================================================================================
  // ================================================================================================================


  // RENDER DATA
  // ================================================================================================================
  // ================================================================================================================

  const initializeInputs = () => {
    const initialInputs: Record<number, UserInput> = {};
    data.forEach((_, index) => {
      initialInputs[index] = {
        uneto: 0,
        kraj: 0
      };
    });
    setUserInputs(initialInputs);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      getLastPopisStavke();
      initializeInputs();
      return () => {
        setData([])
        setUserInputs({})
      }
    }, [])
  );

  // ================================================================================================================
  // ================================================================================================================


  // METHODS FOR HANDLEING INPUTS AND DIALOGS
  // ================================================================================================================
  // ================================================================================================================

  const handleInputChange = (index: number, field: keyof UserInput, value: string) => {
    setUserInputs((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: isNaN(Number(value)) ? 0 : Number(value)
      }
    }));
  };

  const handleDialogConfirm = () => {
    if (activeIndex !== null) {
      // Parse the input, calculate the sum, and update the state
      const sum = dialogValue
        .split("+")
        .map((val) => Number(val.trim()))
        .reduce((acc, num) => acc + num, 0);
  
      setUserInputs((prev) => ({
        ...prev,
        [activeIndex]: {
          ...prev[activeIndex],
          kraj: sum,
          calculationString: dialogValue  // Store the calculation string
        },
      }));
    }
    setIsDialogVisible(false);
  };

  const openDialog = (index: number) => {
    setActiveIndex(index);
    // Set the dialog value to the previous calculation string if it exists
    setDialogValue(userInputs[index]?.calculationString || "");
    setIsDialogVisible(true);
  };

  const handleAddPlus = () => {
    setDialogValue((prev) => prev + "+");
  };

  // ================================================================================================================
  // ================================================================================================================

  // POPIS VALIDATION AND CREATE
  // ================================================================================================================
  // ================================================================================================================

  const isPositiveNumberOrZero = (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  };

  
  const isValidString = (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  };
    
  // Check if date of Popis already has Prva or Druga smena
  const checkExistingPopis = async (date: string, smena: string): Promise<boolean> => {
    try {
      const result = await database.getAllAsync(`
        SELECT * FROM popis 
        WHERE date(datum) = date(?) 
        AND smena = ?
      `, [date, smena]);
      
      return result.length > 0;
    } catch (error) {
      console.error("Error checking existing popis:", error);
      return false;
    }
  };

  // Helper function to get default value for numeric fields
  const getDefaultNumericValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') {
      return '0';
    }
    return value.toString();
  };


  // Validation function
  const validatePopis = async (): Promise<{ isValid: boolean; errors: string[] }> => {
    
    const errors: string[] = [];
    
    // Validate shift selection
    if (!additionalInputs.smena) {
      errors.push('Morate izabrati smenu (prva ili druga).');
    }

    // Check for existing popis with same date and shift
    if (additionalInputs.smena) {
      const today = new Date().toISOString().split('T')[0];
      const existingPopis = await checkExistingPopis(today, additionalInputs.smena);
      
      if (existingPopis) {
        errors.push(`Već postoji ${additionalInputs.smena} smena na današnji datum.`);
      }
    }

    // Validate first table (inventory items)
    data.forEach((item, index) => {
      const itemName = item.naziv || `Item ${index + 1}`;
      const input = userInputs[index];
  
      // Check if input exists at all
      if (!input || input.uneto === undefined || input.uneto === null) {
        errors.push(`Morate uneti vrednost za ${itemName}.`);
        return;
      }
  
      const unetoValue = getDefaultNumericValue(input.uneto);

      if (!isPositiveNumberOrZero(unetoValue)) {
        errors.push(`Uneto za ${itemName} mora biti pozitivan broj.`);
      }
  
      const krajValue = getDefaultNumericValue(input.kraj);
      if (!isPositiveNumberOrZero(krajValue)) {
        errors.push(`Kraj za ${itemName} mora biti pozitivan broj.`);
      }
      
      if(item.naziv === "Espresso"){
        const ukupnoEspresso = calculateUkupnoKafa(item, input, stavka);
        if(!isPositiveNumberOrZero(ukupnoEspresso)){
          errors.push(`Ukupno za Espresso mora biti pozitivan broj.`)
        }
      } else {
        const ukupno = calculateUkupno(item, input, stavka);
        if (!isPositiveNumberOrZero(ukupno)) {
          errors.push(`Ukupno za ${itemName} mora biti pozitivan broj.`);
        }
      }

      
    });
  
    // Validate numeric fields in second table
    const numericFields = [
      { key: 'kuhinja', name: 'Kuhinja' },
      { key: 'ks', name: 'Kuhinja Storno' },
      { key: 'ostalop', name: 'Ostali Prihodi'},
      { key: 'wolt', name: 'Wolt' },
      { key: 'glovo', name: 'Glovo' },
      { key: 'sale', name: 'Sale' },
      { key: 'ostalot', name: 'Ostali Troškovi' },
      { key: 'virman', name: 'Virman' }
    ];
  
    numericFields.forEach(({ key, name }) => {
      const value = getDefaultNumericValue(additionalInputs[key as Exclude<keyof AdditionalInputs, 'datum'>]);
      if (!isPositiveNumberOrZero(value)) {
        errors.push(`${name} mora biti pozitivan broj.`);
      }
    });

    const textFields = [
      { key: 'ostalopOpis', name: 'Opis ostalih prihoda' },
      { key: 'ostalotOpis', name: 'Opis ostalih troškova' },
      { key: 'virmanOpis', name: 'Opis virmana' }
    ];
  
    // Validate description fields
    textFields.forEach(({ key, name }) => {
      const value = getDefaultNumericValue(additionalInputs[key as Exclude<keyof AdditionalInputs, 'datum'>]);
      if (value && !isValidString(value)) {
        errors.push(`${name} mora biti validan tekst.`);
      }
    });
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  const popisConfirm = () => {
    Alert.alert(
      "Adding Confirmation",
      "Da li želite da završite popis? Upozorenje: Ako završite popis za današnji datum i trenutnu smenu, nećete moći da završite ponovo za istu smenu.",
      [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleZavrsiPopis()}]
    );
  }

  const handleZavrsiPopis = async () => {
    try {
      const validation = await validatePopis();
      
      if (!validation.isValid) {
        Alert.alert(
          'Greška u unosu',
          validation.errors.join('\n\n'),
          [{ text: 'OK' }]
        );
        return;
      }
  
      // If validation passes, proceed with saving the popis
      const result = await database.runAsync(`
        INSERT INTO popis (
          datum,
          kuhinja,
          kuhinjaSt,
          ostalop,
          ostalopOpis,
          wolt,
          glovo,
          kartice,
          sale,
          ostalot,
          ostalotOpis,
          virman,
          virmanOpis,
          ukupno,
          smena,
          id_korisnik
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        additionalInputs.datum.toISOString().split('T')[0],
        Number(additionalInputs.kuhinja) || 0,
        Number(additionalInputs.ks) || 0,
        Number(additionalInputs.ostalop) || 0,
        additionalInputs.ostalopOpis,
        Number(additionalInputs.wolt) || 0,
        Number(additionalInputs.glovo) || 0,
        Number(additionalInputs.kartice) || 0,
        Number(additionalInputs.sale) || 0,
        Number(additionalInputs.ostalot) || 0,
        additionalInputs.ostalotOpis,
        Number(additionalInputs.virman) || 0,
        additionalInputs.virmanOpis,
        Number(additionalInputs.ukupnoAll) || 0,
        additionalInputs.smena,
        Number(userData?.id_korisnik)
      ]);
  
      // Get the ID of the newly inserted popis
      const insertId = result.lastInsertRowId;
  

      // OVDE NEGDE JE BUG
      for (const [index, input] of Object.entries(userInputs)) {
        const item = data[Number(index)];
        if (item && input) {
          if(item.naziv !== "Espresso"){
            await database.runAsync(`
              INSERT INTO stavka_popisa (
                id_popis,
                pocetno_stanje,
                uneto,
                krajnje_stanje,
                ukupno,
                id_pice
              ) VALUES (?, ?, ?, ?, ?, ?);
            `, [
              insertId,
              stavka.find((s) => s.id_pice === item.id_pice)?.krajnje_stanje || 0,
              input.uneto || 0,
              input.kraj || 0,
              calculateUkupno(item, input, stavka),
              item.id_pice,
            ]);
          } else {
            await database.runAsync(`
              INSERT INTO stavka_popisa (
                id_popis,
                pocetno_stanje,
                uneto,
                krajnje_stanje,
                ukupno,
                id_pice
              ) VALUES (?, ?, ?, ?, ?, ?);
            `, [
              insertId,
              stavka.find((s) => s.id_pice === item.id_pice)?.krajnje_stanje || 0,
              input.uneto || 0,
              input.kraj || 0,
              calculateUkupnoKafa(item, input, stavka),
              item.id_pice,
            ]);
          }
        }
      }
  
      Alert.alert(
        'Adding Success',
        'Popis je uspešno sačuvan!',
        [{
          text: 'OK',
          onPress: () => router.replace('/(tabs)/vidiPopis')
        }]
      );
  
    } catch (error) {
      console.log(error);
      Alert.alert(
        'Greška',
        'Došlo je do greške prilikom čuvanja popisa.',
        [{ text: 'OK' }]
      );
    }
  };

  // ================================================================================================================
  // ================================================================================================================

  // OTHER METHODS
  // ================================================================================================================
  // ================================================================================================================

  const calculateUkupno = (
    item: Pice,
    input: UserInput | undefined,
    stavka: StavkaPopisa[]
  ) => {
    const matchedStavka = stavka.find((s) => s.id_pice === item.id_pice);
    const pocetnoStanje = matchedStavka?.krajnje_stanje || 0;
    const cena = item.cena;
    const uneto = input?.uneto || 0;
    const kraj = input?.kraj || 0;
    return (pocetnoStanje + uneto - kraj) * cena;
  };
  const calculateUkupnoKafa = (
    item: Pice,
    input: UserInput | undefined,
    stavka: StavkaPopisa[]
  ) => {
    const matchedStavka = stavka.find((s) => s.id_pice === item.id_pice);
    const pocetnoStanje = matchedStavka?.krajnje_stanje || 0;
    const cena = item.cena;
    const uneto = input?.uneto || 0;
    const kraj = input?.kraj || 0;
    return Math.abs((kraj - (pocetnoStanje + uneto)) * cena);
  };

  const calculatePazar = (
    data: Pice[],
    userInputs: Record<number, UserInput>,
    stavka: StavkaPopisa[]
  ) => {
    return data.reduce((total, item, index) => {
      const itemTotal =
        item.naziv === "Espresso"
          ? calculateUkupnoKafa(item, userInputs[index], stavka)
          : calculateUkupno(item, userInputs[index], stavka);
  
      return total + itemTotal;
    }, 0);
  };

  const calculatePrihodi = (inputs: AdditionalInputs) => {
    return Number(inputs.kuhinja || 0) + Number(inputs.ks || 0) + Number(inputs.ostalop || 0);
  };
  
  const calculateTroskovi = (inputs: AdditionalInputs) => {
    return (
      Number(inputs.wolt || 0) +
      Number(inputs.glovo || 0) +
      Number(inputs.kartice || 0) +
      Number(inputs.sale || 0) +
      Number(inputs.ostalot || 0) +
      Number(inputs.virman || 0)
    );
  };

  useEffect(() => {
    const total = calculateUkupnoAll();
    setAdditionalInputs(prev => ({
      ...prev,
      ukupnoAll: total.toString()
    }));
  }, [userInputs, additionalInputs.kuhinja, additionalInputs.ks, additionalInputs.ostalop, 
      additionalInputs.wolt, additionalInputs.glovo, additionalInputs.sale, 
      additionalInputs.ostalot, additionalInputs.virman]);

  const calculateUkupnoAll = () => {
    return (
      (calculatePazar(data, userInputs, stavka) + calculatePrihodi(additionalInputs)) - 
      calculateTroskovi(additionalInputs)
    );
  };
  // ================================================================================================================
  // ================================================================================================================

  return (
    <SafeAreaView className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="flex bg-secondary rounded-3xl m-4 mb-2 p-4">
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
          <View className="flex flex-row bg-secondary rounded-t-md pb-1">
            <Text className="flex-1 text-center text-orange text-lg font-bold">Stavke Popisa</Text>
          </View>
          <View className="flex flex-row justify-between mt-2 border-b-2 border-black pb-2">
            <Text className="flex-1 text-center text-lg font-bold">Naziv</Text>
            <Text className="flex-1 text-center text-lg font-bold">Početak</Text>
            <Text className="flex-1 text-center text-lg font-bold">Uneto</Text>
            <Text className="flex-1 text-center text-lg font-bold">Kraj</Text>
            <Text className="flex-1 text-center text-lg font-bold">Cena</Text>
            <Text className="flex-1 text-center text-lg font-bold">Ukupno</Text>
          </View>

          {data.map((item, index) => (
            <View key={index} className="flex flex-row items-center justify-between py-2 border-b border-black">
              <Text className="flex-1 text-center">{item.naziv}</Text>
              <Text className="flex-1 text-center">{stavka.find((s) => s.id_pice === item.id_pice)?.krajnje_stanje || 0}</Text>

              <TextInput
                className="flex-1 text-center mx-2 border border-gray-400 rounded"
                keyboardType="numeric"
                placeholder= "0"
                value={userInputs[index]?.uneto?.toString() || ""}
                onChangeText={(value) => handleInputChange(index, "uneto", value === "" ? "0" : value)}
              />

              <TouchableOpacity
                onPress={() => openDialog(index)}
                className="flex-1 text-center border border-gray-400 rounded h-14 px-2 justify-center items-center"
              >
                <Text>
                  {userInputs[index]?.kraj?.toString() || "0"}
                </Text>
              </TouchableOpacity>

              <Text className="flex-1 text-center">{item.cena} RSD</Text>
              <Text className="flex-1 text-center">
                {item.naziv === "Espresso"
                  ? calculateUkupnoKafa(item, userInputs[index], stavka)
                  : calculateUkupno(item, userInputs[index], stavka)}{" "}
                RSD
              </Text>
            </View>
          ))}
        </View>
        <View className="m-4 mt-2">
          <View className="flex flex-row bg-secondary rounded-t-md pb-1">
            <Text className="flex-1 text-center text-green-600 text-lg font-bold">Prihodi</Text>
          </View>

          {/* First Row: Kuhinja, KS, Ostali Prihodi, Ostali Prihodi Opis */}
          <View className="flex flex-row py-2 border-b border-black">
            <View className="flex-1 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Kuhinja</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.kuhinja}
                onChangeText={(value: string) =>
                  setAdditionalInputs((prev) => ({ ...prev, kuhinja: value }))
                }
                placeholder="Unesi kuhinju..."
              />
            </View>
            <View className="flex-1 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Kuhinja Storno</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.ks}
                onChangeText={(value: string) =>
                  setAdditionalInputs((prev) => ({ ...prev, ks: value }))
                }
                placeholder="Unesi KS..."
              />
            </View>
          </View>

          <View className="flex flex-row py-2 border-b border-black">
            <View className="w-1/3 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Ostali Prihodi</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.ostalop}
                onChangeText={(value: string) =>
                  setAdditionalInputs((prev) => ({ ...prev, ostalop: value }))
                }
                placeholder="Unesi ostale prihode..."
              />
            </View>
            <View className="w-2/3 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Ostali Prihodi Opis</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                value={additionalInputs.ostalopOpis}
                onChangeText={(value: string) =>
                  setAdditionalInputs((prev) => ({ ...prev, ostalopOpis: value }))
                }
                placeholder="Unesi opis..."
              />
            </View>
          </View>
          
          <View className="flex flex-row bg-secondary rounded-t-md pb-1 mt-4">
            <Text className="flex-1 text-center text-red-600 text-lg font-bold">Troškovi</Text>
          </View>

          <View className="flex flex-row py-2 border-b border-black">
            <View className="flex-1 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Wolt</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.wolt}
                onChangeText={(value: string) => 
                  setAdditionalInputs(prev => ({ ...prev, wolt: value }))
                }
                placeholder="Unesi wolt..."
              />
            </View>
            <View className="flex-1 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Glovo</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.glovo}
                onChangeText={(value: string) => 
                  setAdditionalInputs(prev => ({ ...prev, glovo: value }))
                }
                placeholder="Unesi glovo..."
              />
            </View>
          </View>

          <View className="flex flex-row py-2 border-b border-black">
            <View className="flex-1 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Sale</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.sale}
                onChangeText={(value: string) => 
                  setAdditionalInputs(prev => ({ ...prev, sale: value }))
                }
                placeholder="Unesi sale..."
              />
            </View>
            <View className="flex-1 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Kartice</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.kartice}
                onChangeText={(value: string) =>
                  setAdditionalInputs((prev) => ({ ...prev, kartice: value }))
                }
                placeholder="Unesi kartice..."
              />
            </View>
          </View>

          {/* Fourth Row: Ostalo and Ostalo Opis */}
          <View className="flex flex-row py-2 border-b border-black">
            <View className="w-1/3 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Ostali Troškovi</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.ostalot}
                onChangeText={(value: string) => 
                  setAdditionalInputs(prev => ({ ...prev, ostalot: value }))
                }
                placeholder="Unesi ostale troškove..."
              />
            </View>
            <View className="w-2/3 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Ostali Troškovi Opis</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                value={additionalInputs.ostalotOpis}
                onChangeText={(value: string) => 
                  setAdditionalInputs(prev => ({ ...prev, ostalotOpis: value }))
                }
                placeholder="Unesi opis..."
              />
            </View>
          </View>

          {/* Fifth Row: Virman and Virman Opis */}
          <View className="flex flex-row py-2 border-b border-black">
            <View className="w-1/3 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Virman</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                keyboardType="number-pad"
                value={additionalInputs.virman}
                onChangeText={(value: string) => 
                  setAdditionalInputs(prev => ({ ...prev, virman: value }))
                }
                placeholder="Unesi virman..."
              />
            </View>
            <View className="w-2/3 px-2">
              <Text className="text-left pl-1 font-semibold mb-1">Virman Opis</Text>
              <TextInput
                className="h-14 border border-gray-400 rounded px-2"
                value={additionalInputs.virmanOpis}
                onChangeText={(value: string) => 
                  setAdditionalInputs(prev => ({ ...prev, virmanOpis: value }))
                }
                placeholder="Unesi opis..."
              />
            </View>
          </View>
        </View>

        <View className="m-4 mt-2 bg-primary rounded-lg p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-7/12 bg-orange py-4 rounded-lg"
            onPress={popisConfirm}
            
          >
            <Text className="text-black text-center text-lg font-bold">
              Završi Popis
            </Text>
          </TouchableOpacity>
            <View className="w-2/6  bg-white rounded-lg border border-gray-300">
              <Picker
                selectedValue={additionalInputs.smena}
                onValueChange={(itemValue) =>
                  setAdditionalInputs(prev => ({ ...prev, smena: itemValue }))
                }
                className="h-12"
              >
                <Picker.Item label= "[Smena]" value=""/>
                <Picker.Item label="Prva smena" value="prva" enabled={isBefore16h} />
                <Picker.Item label="Druga smena" value="druga" enabled={isAfter16h} />
              </Picker>
            </View>
        </View>
          <View className="space-y-4">
            {/* Pazar Row */}
            <View className="flex flex-row justify-between items-center border-b border-gray-300 pb-2">
              <Text className="text-lg font-bold">Piće:</Text>
              <Text className="text-lg">
                {calculatePazar(data, userInputs, stavka).toLocaleString()} RSD
              </Text>
            </View>
            
            {/* Prihodi Row */}
            <View className="flex flex-row justify-between items-center border-b border-gray-300 pb-2">
              <Text className="text-lg font-bold">Prihodi:</Text>
              <Text className="text-lg">
                {calculatePrihodi(additionalInputs).toLocaleString()} RSD
              </Text>
            </View>
            
            {/* Troškovi Row */}
            <View className="flex flex-row justify-between items-center border-b border-gray-300 pb-2">
              <Text className="text-lg font-bold">Troškovi:</Text>
              <Text className="text-lg">
                - {calculateTroskovi(additionalInputs).toLocaleString()} RSD
              </Text>
            </View>
            
            {/* Ukupno Row */}
            <View className="flex flex-row justify-between items-center pt-2">
              <Text className="text-xl font-bold">Ukupno:</Text>
              <Text className="text-xl font-bold text-secondary">
                {Number(additionalInputs.ukupnoAll).toLocaleString()} RSD
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Dialog Modal */}
      <DialogModal
        visible={isDialogVisible}
        value={dialogValue}
        onChangeText={setDialogValue}
        onConfirm={handleDialogConfirm}
        onCancel={() => setIsDialogVisible(false)}
        onAddPlus={handleAddPlus}
      />
    </SafeAreaView>
  );
};

export default Popis;