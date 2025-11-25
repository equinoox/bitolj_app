import React from 'react'
import { router } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native'
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5, MaterialIcons, AntDesign, Fontisto } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useCallback, useEffect } from 'react'
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { SessionExpiredOverlay } from '../../components/SessionExpiredOverlay';
import { TextInputWithReset } from '../../components/TextInputWithReset';
import { TouchableOpacityWithReset } from '../../components/TouchableOpacityWithReset';

const opcijePopis = () => {

    // ================================================================================================================
    // ================================================================================================================

    type Popis = {
        id_popis: number; datum: string; kuhinja: string; kuhinjaSt: string; ostalop: string;
        ostalopOpis: string; wolt: string; glovo: string; kartice: string; sale: string;
        ostalot: string; ostalotOpis: string; virman: string; virmanOpis: string;
        ukupno: string; smena: string; id_korisnik: number;
      };


    type Pice = {
    id_pice: number; naziv: string; cena: string;
    type: string; position: number; pocetno_stanje?: string; prodato?: string;
    };

    type Stavka_Popisa = {
    id_stavka_popisa: number; id_popis: number; pocetno_stanje: string;
    uneto: string; krajnje_stanje: string; prodato: string; ukupno: string; id_pice: number;
    };

    interface InputValues {
        [key: number]: {
            pocetak: string;
            uneto: string;
            kraj: string;
        };
    }
      
    interface StavkaUpdate {
        id_stavka_popisa: number;
        pocetno_stanje: number;
        uneto: number;
        krajnje_stanje: number;
        krajnje_stanje_string: string;
        prodato: number;
        ukupno: number;
        prodato_other: number;
        ukupno_other: number;
    }

    interface PrihodiValues {
        kuhinja: string;
        kuhinjaSt: string;
        ostalop: string;
        ostalopOpis: string;
      }
      
      interface TroskoviValues {
        wolt: string;
        glovo: string;
        sale: string;
        kartice: string;
        ostalot: string;
        virman: string;
        ostalotOpis: string;
        virmanOpis: string;
      }
    

   // ================================================================================================================
   // ================================================================================================================
      

    const { userData, isSessionExpired, setUserData, resetInactivityTimeout } = useAuth();
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
    const [inputValues, setInputValues] = useState<InputValues>({});
    const [localExpressions, setLocalExpressions] = useState<{ [key: number]: string }>({});

    const [prihodiValues, setPrihodiValues] = useState<PrihodiValues>({
        kuhinja: selectedPopis?.kuhinja || '',
        kuhinjaSt: selectedPopis?.kuhinjaSt || '',
        ostalop: selectedPopis?.ostalop || '',
        ostalopOpis: selectedPopis?.ostalopOpis || '',
      });
      
      const [troskoviValues, setTroskoviValues] = useState<TroskoviValues>({
        wolt: selectedPopis?.wolt || '',
        glovo: selectedPopis?.glovo || '',
        sale: selectedPopis?.sale || '',
        kartice: selectedPopis?.kartice || '',
        ostalot: selectedPopis?.ostalot || '',
        virman: selectedPopis?.virman || '',
        ostalotOpis: selectedPopis?.ostalotOpis || '',
        virmanOpis: selectedPopis?.virmanOpis || '',
      });

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
      if (!expression) return '';
      try {
        // Only evaluate if the expression contains operators
        if (/[+\-*/]/.test(expression)) {
          // Replace multiple operators with single ones and remove spaces
          const sanitizedExp = expression.replace(/\s+/g, '').replace(/([+\-*/])+/g, '$1');
          return String(eval(sanitizedExp));
        }
        return expression;
      } catch (error) {
        return expression; // Return original expression if evaluation fails
      }
    };

    // ================================================================================================================
    // ================================================================================================================


    // ================================================================================================================
    // ================================================================================================================

    const handleInputChange = (
        id_stavka_popisa: number,
        field: keyof InputValues[number],
        value: string
      ): void => {
        // Validate numeric input
        setInputValues((prevValues) => ({
            ...prevValues,
            [id_stavka_popisa]: {
              ...prevValues[id_stavka_popisa],
              [field]: value, // Update the specific field (e.g., 'kraj')
            },
          }));
      };

      const handlePrihodiChange = (field: string, value: string) => {
        setPrihodiValues((prevValues) => ({
          ...prevValues,
          [field]: value,
        }));
      };
      
      const handleTroskoviChange = (field: string, value: string) => {
        setTroskoviValues((prevValues) => ({
          ...prevValues,
          [field]: value,
        }));
      };

      const calculateProdato = (stavka: Stavka_Popisa): number => {
        const values = inputValues[stavka.id_stavka_popisa];
        if (!values) return 0;
      
        const pocetno = parseFloat(values.pocetak) || 0;
        const uneto = parseFloat(values.uneto) || 0;
        const krajnje = parseFloat(evaluateExpression(values.kraj)) || 0; // Evaluate expression first
        return pocetno + uneto - krajnje;
      };
      
      const calculateProdatoOther = (stavka: Stavka_Popisa): number => {
        const values = inputValues[stavka.id_stavka_popisa];
        if (!values) return 0;
      
        const pocetno = parseFloat(values.pocetak) || 0;
        const krajnje = parseFloat(evaluateExpression(values.kraj)) || 0; // Evaluate expression first
        return krajnje - pocetno; // prodato_other = kraj - pocetak
      };
      
      const calculateTotal = (stavka: Stavka_Popisa, matchingPice: Pice | undefined): number => {
        const prodato = calculateProdato(stavka);
        const cena = parseFloat(matchingPice!.cena || "0");
        return prodato * cena;
      };
      
      const calculateTotalOther = (stavka: Stavka_Popisa, matchingPice: Pice | undefined): number => {
        const prodato_other = calculateProdatoOther(stavka);
        const cena = parseFloat(matchingPice!.cena || "0");
        return prodato_other * cena; // ukupno_other = prodato_other * cena
      };

      const calculateTotalPrihodi = (prihodiValues: PrihodiValues): number => {
        const kuhinja = parseFloat(prihodiValues.kuhinja) || 0;
        const kuhinjaSt = parseFloat(prihodiValues.kuhinjaSt) || 0;
        const ostalop = parseFloat(evaluateExpression(prihodiValues.ostalop)) || 0;
      
        return kuhinja + kuhinjaSt + ostalop;
      };

      const calculateTotalTroskovi = (troskoviValues: TroskoviValues): number => {
        const wolt = parseFloat(evaluateExpression(troskoviValues.wolt)) || 0;
        const glovo = parseFloat(evaluateExpression(troskoviValues.glovo)) || 0;
        const sale = parseFloat(evaluateExpression(troskoviValues.sale)) || 0;
        const kartice = parseFloat(evaluateExpression(troskoviValues.kartice)) || 0;
        const ostalot = parseFloat(evaluateExpression(troskoviValues.ostalot)) || 0;
        const virman = parseFloat(evaluateExpression(troskoviValues.virman)) || 0;
      
        return wolt + glovo + sale + kartice + ostalot + virman;
      };

      const deleteConfirm = (id_popis: number) => {
        if(!selectedPopis || id_popis === 0){
          Alert.alert("Delete Error", "Greška u odabiru popisa za brisanje.")
          return
        }
        Alert.alert(
          "Delete Confirmation",
          "Da li želite da izbrišete Popis? Posle ove akcije, nije moguće povratiti popis!",
          [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleDelete(id_popis)}]
        );
      }

      const handleDelete = async (id_popis: number) => {
        try {
          await database.runAsync("DELETE from popis WHERE id_popis = ?", [id_popis])
          setSelectedPopis(null);
          Alert.alert(
            'Adding Success',
            'Popis je uspešno promenjen! Aplikacija će se resetovati kako bi se sačuvale promene.',
            [{ text: "OK", onPress: async () => {
              await setUserData(null);
              router.replace('/');
            }}]
          );
        } catch (error) {
            console.log(error)
        }
      }

      const updateConfirm = () => {
        Alert.alert(
          "Update Confirmation",
          "Da li želite da promenite Popis?",
          [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleSaveChanges()}]
        );
      }

      // UPDATE
      const handleSaveChanges = async (): Promise<void> => {
        try {
          const updates: StavkaUpdate[] = Object.entries(inputValues).map(([id_stavka_popisa, values]) => {
            const stavka = dataStavka.find(s => s.id_stavka_popisa === parseInt(id_stavka_popisa));
            if (!stavka) throw new Error(`Stavka not found for id: ${id_stavka_popisa}`);
            
            const matchingPice = dataPice.find(p => p.id_pice === stavka.id_pice);

            const pocetno_stanje = parseFloat(values.pocetak) || 0;
            const uneto = parseFloat(values.uneto) || 0;
            const krajnje_stanje_string = values.kraj || "0";
            const krajnje_stanje = parseFloat(evaluateExpression(values.kraj)) || 0;
            const prodato = calculateProdato(stavka);
            const ukupno = calculateTotal(stavka, matchingPice);
            const prodato_other = calculateProdatoOther(stavka);
            const ukupno_other = calculateTotalOther(stavka, matchingPice);
      
            // Determine which values to use based on matchingPice.type
            const useOther = matchingPice?.type === "other";
            const finalProdato = useOther ? prodato_other : prodato;
            const finalUkupno = useOther ? ukupno_other : ukupno;
      
            const update: StavkaUpdate = {
              id_stavka_popisa: parseInt(id_stavka_popisa),
              pocetno_stanje,
              uneto,
              krajnje_stanje_string,
              krajnje_stanje,
              prodato: finalProdato, // Use conditional value
              ukupno: finalUkupno, // Use conditional value
              prodato_other,
              ukupno_other,
            };
      
            return update;
          });
      
          try {
            await Promise.all(
                updates.map(update => {
                  // console.log("Menja se stavka ID: " + update.id_stavka_popisa)
                  // console.log("Pocetno stanje: " +  update.pocetno_stanje)
                  // console.log("Uneto: " +  update.uneto)
                  // console.log("Krajnje stanje: " +  update.krajnje_stanje_string)
                  // console.log("Prodato: " +  update.prodato)
                  // console.log("Ukupno: " +  update.ukupno)
                  database.runAsync(
                    "UPDATE stavka_popisa SET pocetno_stanje = ?, uneto = ?, krajnje_stanje = ?, prodato = ?, ukupno = ? WHERE id_stavka_popisa = ?",
                    [
                      update.pocetno_stanje.toString(),
                      update.uneto.toString(),
                      update.krajnje_stanje_string, // This is expression
                      update.prodato.toString(), // This will be either prodato or prodato_other
                      update.ukupno.toString(), // This will be either ukupno or ukupno_other
                      update.id_stavka_popisa,
                    ]
                  )
                }
                )
              );
          } catch (error) {
            throw error;
          }
        } catch (error) {
          Alert.alert('Greška', 'Došlo je do greške prilikom čuvanja promena');
          console.error(error);
        }

        try {
            // Combine prihodiValues and troskoviValues into a single object
            const updatedPopis = {
              ...selectedPopis,
              ...prihodiValues,
              ...troskoviValues,
            };
        
            if(updatedPopis.id_popis){
                await database.runAsync(
                  `UPDATE Popis SET
                   kuhinja = ?,
                   kuhinjaSt = ?,
                   ostalop = ?,
                   ostalopOpis = ?,
                   wolt = ?,
                   glovo = ?,
                   sale = ?,
                   kartice = ?,
                   ostalot = ?,
                   virman = ?,
                   ostalotOpis = ?,
                   virmanOpis = ?
                   WHERE id_popis = ?`,
                  [
                    updatedPopis.kuhinja,
                    updatedPopis.kuhinjaSt,
                    updatedPopis.ostalop,
                    updatedPopis.ostalopOpis,
                    updatedPopis.wolt,
                    updatedPopis.glovo,
                    updatedPopis.sale,
                    updatedPopis.kartice,
                    updatedPopis.ostalot,
                    updatedPopis.virman,
                    updatedPopis.ostalotOpis,
                    updatedPopis.virmanOpis,
                    updatedPopis.id_popis,
                  ]
                );
                setSelectedPopis(null)
                Alert.alert(
                  'Adding Success',
                  'Popis je uspešno promenjen! Aplikacija će se resetovati kako bi se sačuvale promene.',
                  [{ text: "OK", onPress: async () => {
                    await setUserData(null);
                    router.replace('/');
                  }}]
                );
            }
            // Update the database
        
          } catch (error) {
            Alert.alert('Greška', 'Došlo je do greške prilikom čuvanja promena');
            console.error(error);
          }
      };



    // ================================================================================================================
    // ================================================================================================================


    // ================================================================================================================
    // ================================================================================================================

    useFocusEffect(
    useCallback( () => {
        loadData();
    }, [])
    );

    useEffect(() => {
      if (dataStavka) {
        const initialValues: InputValues = {};
        dataStavka.forEach(stavka => {
          initialValues[stavka.id_stavka_popisa] = {
            pocetak: stavka.pocetno_stanje?.toString() || '',
            uneto: stavka.uneto?.toString() || '',
            kraj: stavka.krajnje_stanje?.toString() || ''
          };
        });
        setInputValues(initialValues);
        // Initialize localExpressions with the same kraj values
        const initialExpressions: { [key: number]: string } = {};
        dataStavka.forEach(stavka => {
          initialExpressions[stavka.id_stavka_popisa] = stavka.krajnje_stanje?.toString() || '';
        });
        setLocalExpressions(initialExpressions);
      }
    }, [selectedPopis, dataStavka]);


      
    useEffect(() => {
    // console.log("selectedPopis:", selectedPopis);
    if (selectedPopis) {
        setPrihodiValues({
        kuhinja: selectedPopis.kuhinja || '',
        kuhinjaSt: selectedPopis.kuhinjaSt || '',
        ostalop: selectedPopis.ostalop || '',
        ostalopOpis: selectedPopis.ostalopOpis || '',
        });
    
        setTroskoviValues({
        wolt: selectedPopis.wolt || '',
        glovo: selectedPopis.glovo || '',
        sale: selectedPopis.sale || '',
        kartice: selectedPopis.kartice || '',
        ostalot: selectedPopis.ostalot || '',
        virman: selectedPopis.virman || '',
        ostalotOpis: selectedPopis.ostalotOpis || '',
        virmanOpis: selectedPopis.virmanOpis || '',
        });
    }
    }, [selectedPopis]);
    // ================================================================================================================
    // ================================================================================================================

  return (
    <SafeAreaView className= "flex-1">
        <View
        className="flex-1"
        onStartShouldSetResponder={() => {
          resetInactivityTimeout();
          return false;
        }}
      >
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
      <View className="flex bg-secondary rounded-3xl m-4 p-4">
          {/* Logout Button */}
          {userData?.role === "admin" ? (
            <>
            <TouchableOpacity
            className="absolute top-4 right-4 bg-secondary rounded-md items-center"
            onPress={logoutConfirm}
            >
              <AntDesign name="logout" size={42} color="#AA0000" />
            </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacityWithReset
            className="absolute top-4 right-4 bg-secondary rounded-md items-center"
            onPress={logoutConfirm}
            >
              <AntDesign name="logout" size={42} color="#AA0000" />
            </TouchableOpacityWithReset>
          )}

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

        {userData?.role === 'admin' ? (
        <View className="m-4">
        <View className="flex flex-row justify-center items-center mb-4">
          <Text className="text-lg font-bold text-black mx-2">Izaberite Popis:</Text>
          <View className="border border-gray-300 rounded w-2/5">
            <Picker
              selectedValue={selectedPopis?.id_popis || ""}
              onValueChange={(itemValue) => {
                const selected = data.find((popis) => popis.id_popis === itemValue);
                setSelectedPopis(selected || null);
              if (selected?.id_popis !== undefined) {
                  loadStavke(selected?.id_popis)
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
          <TouchableOpacityWithReset
              className={`ml-2 px-6 py-4 rounded ${
                selectedPopis ? "bg-red-500"  : "bg-gray-400 text-primary"
              }`}
              disabled={!selectedPopis}
              onPress={() => {deleteConfirm(selectedPopis?.id_popis === undefined ? 0 : selectedPopis.id_popis)}}
            >
              <Text className="text-white font-bold">Izbriši Popis</Text>
            </TouchableOpacityWithReset>
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
                {dataStavka
                  .map((stavka) => {
                    const matchingPice = dataPice.find((pice) => pice.id_pice === stavka.id_pice);
                    return { ...stavka, pice: matchingPice };
                  })
                  .sort((a, b) => {
                    // Define the priority order for types
                    const typePriority: { [key: string]: number } = {
                      'piece': 1,
                      'liters': 2,
                      'kilograms': 3,
                      'other': 4
                    };

                    // Get the priority for each type, defaulting to a high number if the type is not in the map
                    const priorityA = typePriority[a.pice?.type || 'other'] || 4;
                    const priorityB = typePriority[b.pice?.type || 'other'] || 4;

                    // First sort by type priority
                    if (priorityA !== priorityB) {
                      return priorityA - priorityB;
                    }

                    // Then sort by position within the same type
                    const posA = a.pice?.position ?? 9999;
                    const posB = b.pice?.position ?? 9999;
                    return posA - posB;
                  })
                  .map((stavka) => {
                    // Keep the `values` object as it is
                    const values = inputValues[stavka.id_stavka_popisa] || {
                      pocetno_stanje: '',
                      uneto: '',
                      krajnje_stanje: ''
                    };

                    const matchingPice = stavka.pice;

                    return (
                      <View
                        key={stavka.id_stavka_popisa}
                        className="flex-row border-b items-center justify-center"
                      >
                        <Text className="w-32 text-center text-lg text-gray-700 py-2">
                          {matchingPice?.naziv || 'N/A'}
                        </Text>

                        <TextInputWithReset
                          keyboardType='number-pad'
                          className="w-32 text-center text-lg text-gray-700 py-2 mx-1 border rounded-md my-2 bg-gray-100 border-gray-400"
                          value={values.pocetak}
                          onChangeText={(value) => handleInputChange(stavka.id_stavka_popisa, 'pocetak', value)}
                        />

                        {matchingPice?.type !== "other" ? (
                          <TextInputWithReset
                            keyboardType="number-pad"
                            className="w-32 text-center text-lg text-gray-700 py-2 mx-1 border rounded-md my-2 bg-gray-100 border-gray-400"
                            value={values.uneto}
                            onChangeText={(value) => handleInputChange(stavka.id_stavka_popisa, 'uneto', value)}
                          />
                        ) : (
                          <Text className="w-32 text-center my-2 text-lg text-gray-700 py-2">
                            N/A
                          </Text>
                        )}

                        <TextInputWithReset
                          keyboardType='default'
                          className="w-32 text-center text-lg text-gray-700 py-2 mx-1 border rounded-md my-2 bg-gray-100 border-gray-400"
                          value={localExpressions[stavka.id_stavka_popisa] || ''}
                          onChangeText={(value) => {
                            const sanitizedValue = value.replace(/[^0-9+]/g, '');
                            setLocalExpressions(prev => ({
                              ...prev,
                              [stavka.id_stavka_popisa]: sanitizedValue
                            }));
                          }}
                          onBlur={() => {
                            handleInputChange(
                              stavka.id_stavka_popisa,
                              'kraj',
                              localExpressions[stavka.id_stavka_popisa] || ''
                            );
                          }}
                        />

                        <Text className="w-28 text-center text-lg text-gray-700 py-2">
                          {matchingPice?.type !== "other" ? calculateProdato(stavka) : calculateProdatoOther(stavka)}
                        </Text>

                        <Text className="w-28 text-center text-lg text-gray-700 py-2">
                          {matchingPice?.cena || 'N/A'}
                        </Text>

                        <Text className="w-28 text-center text-lg font-bold text-secondary py-2">
                          {matchingPice?.type !== "other" ? calculateTotal(stavka, matchingPice) : calculateTotalOther(stavka, matchingPice)} din
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
              <TextInputWithReset
              keyboardType='number-pad'
              className="flex-1 text-center text-lg text-gray-700 py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
              value={prihodiValues.kuhinja}
              onChangeText={(value) => handlePrihodiChange('kuhinja', value)}
              />

              <TextInputWithReset
              keyboardType='number-pad'
              className="flex-1 text-center text-lg text-gray-700 py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
              value={prihodiValues.kuhinjaSt}
              onChangeText={(value) => handlePrihodiChange('kuhinjaSt', value)}
              />

              <TextInputWithReset
              keyboardType='number-pad'
              className="flex-1 text-center text-lg text-gray-700 py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
              value={evaluateExpression(prihodiValues.ostalop)}
              onChangeText={(value) => handlePrihodiChange('ostalop', value)}
              onPress={() => {
                const expression = prihodiValues.ostalop || 'N/A';
                Alert.alert('Izraz', `Sabirak: ${expression}`);
              }}
              />
              <Text className="flex-1 text-center font-bold text-secondary text-lg py-2">
              {calculateTotalPrihodi(prihodiValues).toFixed(2)} din
              </Text>
            </View>
            {/* Description section for Prihodi */}
            <View className="flex flex-row bg-gray-100">
              <Text className="flex-1 text-center font-bold text-lg text-gray-600 py-2">Opis Ostalih Prihoda</Text>
            </View>
            <View className="flex flex-row">
              <TextInputWithReset
              className="flex-1 text-center text-lg text-gray-700 py-2 border rounded-md bg-gray-100 border-gray-400"
              value={prihodiValues.ostalopOpis}
              onChangeText={(value) => handlePrihodiChange('ostalopOpis', value)}
              />
            </View>
          </View>

          {/* Second Table: Troškovi */}
          <View className="w-full bg-white rounded-3xl shadow-md">
            <View className="flex flex-row border-b bg-secondary">
              <Text className="flex-1 text-center text-red-600 font-bold text-xl py-2">Troškovi</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Titles */}
                <View className="flex-row justify-center items-center border-b bg-secondary">
                  <Text className="w-28 text-center text-white text-lg font-bold py-2">Wolt</Text>
                  <Text className="w-28 text-center text-white text-lg font-bold py-2">Glovo</Text>
                  <Text className="w-28 text-center text-white text-lg font-bold py-2">Sale</Text>
                  <Text className="w-28 text-center text-white text-lg font-bold py-2">Kartice</Text>
                  <Text className="w-28 text-center text-white text-lg font-bold py-2">Ostali Troškovi</Text>
                  <Text className="w-28 text-center text-white text-lg font-bold py-2">Virmani</Text>
                  <Text className="w-28 text-center text-white text-lg font-bold py-2">Ukupno</Text>
                </View>

                {/* Inputs under Titles */}
                <View className="flex-row border-b">
                  <TextInputWithReset
                    keyboardType="number-pad"
                    className="w-28 text-center text-gray-700 text-lg py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
                    value={evaluateExpression(troskoviValues.wolt)}
                    onChangeText={(value) => handleTroskoviChange("wolt", value)}
                  />

                  <TextInputWithReset
                    keyboardType="number-pad"
                    className="w-28 text-center text-gray-700 text-lg py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
                    value={evaluateExpression(troskoviValues.glovo)}
                    onChangeText={(value) => handleTroskoviChange("glovo", value)}
                  />

                  <TextInputWithReset
                    keyboardType="number-pad"
                    className="w-28 text-center text-gray-700 text-lg py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
                    value={evaluateExpression(troskoviValues.sale)}
                    onChangeText={(value) => handleTroskoviChange("sale", value)}
                  />

                  <TextInputWithReset
                    keyboardType="number-pad"
                    className="w-28 text-center text-gray-700 text-lg py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
                    value={evaluateExpression(troskoviValues.kartice)}
                    onChangeText={(value) => handleTroskoviChange("kartice", value)}
                  />

                  <TextInputWithReset
                    keyboardType="number-pad"
                    className="w-28 text-center text-gray-700 text-lg py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
                    value={evaluateExpression(troskoviValues.ostalot)}
                    onChangeText={(value) => handleTroskoviChange("ostalot", value)}
                  />

                  <TextInputWithReset
                    keyboardType="number-pad"
                    className="w-28 text-center text-gray-700 text-lg py-2 border rounded-md my-2 bg-gray-100 border-gray-400"
                    value={evaluateExpression(troskoviValues.virman)}
                    onChangeText={(value) => handleTroskoviChange("virman", value)}
                  />

                  {/* Total */}
                  <Text className="w-28 text-center font-bold text-secondary text-lg py-2">
                    {calculateTotalTroskovi(troskoviValues).toFixed(2)} din
                  </Text>
                </View>
              </View>
            </ScrollView>
            {/* Description section for Troškovi */}
            <View className="flex flex-col">
              <View className="flex flex-row bg-gray-100">
                <Text className="flex-1 text-center font-bold text-gray-600 text-lg py-2">Opis Ostalih Troškova</Text>
                <Text className="flex-1 text-center font-bold text-gray-600 text-lg py-2">Opis Virmana</Text>
              </View>
              <View className="flex flex-row">
              <TextInputWithReset
              className="flex-1 text-center text-gray-700 text-lg py-2 border rounded-md bg-gray-100 border-gray-400"
              value={troskoviValues.ostalotOpis}
              onChangeText={(value) => handleTroskoviChange('ostalotOpis', value)}
              />

              <TextInputWithReset
              className="flex-1 text-center text-gray-700 text-lg py-2 border rounded-md bg-gray-100 border-gray-400"
              value={troskoviValues.virmanOpis}
              onChangeText={(value) => handleTroskoviChange('virmanOpis', value)}
              />
              </View>
            </View>
            
          </View>
          <View className="flex flex-row justify-center rounded-lg bg-white mt-4">
          <TouchableOpacityWithReset 
              className="w-7/12 bg-orange py-4 rounded-lg"
              onPress={updateConfirm}
              >
              <Text className="text-black text-center text-lg font-bold">
                  Promeni Popis
              </Text>
          </TouchableOpacityWithReset>
          </View>
        </>
      )}
      </View>
          ) : (
            // Non-admin content
            <View className="mt-8 mx-12 p-4 bg-red-100 rounded-lg justify-center items-center">
              <MaterialIcons name="cancel" size={74} color="#393B44" />
              <Text className="text-red-600 text-center text-lg">
                Ne možete pristupiti jer nemate administratorske privilegije.
              </Text>
            </View>
          )}


      </ScrollView>
      <SessionExpiredOverlay
        visible={isSessionExpired}
        onLogout={logout}
      />
      </View>
    </SafeAreaView>
  )
}

export default opcijePopis