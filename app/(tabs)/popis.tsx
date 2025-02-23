import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'
import DialogModal from '@/components/DialogModal';
import DialogModalN from '@/components/DialogModalN';
import PTDialogModal from '@/components/PTDialogModal';
import React from 'react'


const Popis = () => {

  // LOGIN & LOGOUT
  // ===============================================  =================================================================
  // ================================================================================================================
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

  const [isLoading, setIsLoading] = useState(true);


  // ================================================================================================================
  // ================================================================================================================

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
  const today = new Date().toISOString().split('T')[0];

  const [prvaSmenaEnabled, setPrvaSmenaEnabled] = useState(false)
  const [drugaSmenaEnabled, setDrugaSmenaEnabled] = useState(false)

  const checkForPrvaSmena = async (date: string) => {
    try {
      const result = await database.getAllAsync(`
        SELECT * FROM popis 
        WHERE date(datum) = date(?) 
        AND smena = ?
      `, [date, "prva"]);
      
      if(result.length > 0){
        setPrvaSmenaEnabled(false)
        setDrugaSmenaEnabled(true)
      } else {
        setPrvaSmenaEnabled(true)
        setDrugaSmenaEnabled(false)
      }
    } catch (error) {
      console.error("Error checking smena:", error);
    }
  };


  // ================================================================================================================
  // ================================================================================================================

  // INTERFACES
  // ================================================================================================================
  // ================================================================================================================

  interface PrihodiTroskoviInputs {
    kuhinja: string; ks: string; ostalop: string;
    ostalopOpis: string; wolt: string; glovo: string; sale: string; 
    kartice: string; ostalot: string; virman: string; ostalotOpis: 
    string; virmanOpis: string;
  }

  interface OtherInputs {
    datum: string; ukupnoAll: string; smena:string
  }

  type InputValues = {
    [key: number]: {
        pocetak: string
        uneto: string;
        kraj: string;
    };
  };
    
  type PiceTableProps = {
      dataPice: Pice[];
      stavkePopisa: Stavka_Popisa[];
  };

  type Pice = {
    id_pice: number; naziv: string; cena: string;
    type: string; pocetno_stanje?: string; prodato?: string;
  };

  type Stavka_Popisa = {
    id_stavka_popisa: number; id_popis: number; pocetno_stanje: string;
    uneto: string; krajnje_stanje: string; prodato: string; ukupno: string; id_pice: number;
  };

  type Popis = {
    id_popis: number; datum: string; kuhinja: string; kuhinjaSt: string; ostalop: string;
    ostalopOpis: string; wolt: string; glovo: string; kartice: string; sale: string;
    ostalot: string; ostalotOpis: string; virman: string; virmanOpis: string;
    ukupno: string; smena: string; id_korisnik: number;
  };


  // ================================================================================================================
  // ================================================================================================================


  // USESTATE HOOKS
  // ================================================================================================================
  // ================================================================================================================

  const [PTInptus, setPTInptus] = useState<PrihodiTroskoviInputs>({
    kuhinja: '', ks: '', ostalop: '', ostalopOpis: '', wolt: '',
    glovo: '', sale: '', kartice: '', ostalot: '', virman: '', ostalotOpis: '',
    virmanOpis: ''
  });
  
  const [otherInputs, setOtherInputs] = useState({
    datum: new Date().toLocaleString("en-GB", { timeZone: "Europe/Belgrade" }),
    smena: ''
  })
  
  const [inputValues, setInputValues] = useState<InputValues>({});

  const [piceData, setPiceData] = useState<Pice[]>([]);
  const [stavkaData, setstavkaData] = useState<Stavka_Popisa[]>([]);
  const [touchedInputs, setTouchedInputs] = useState<Set<string>>(new Set());
  
  // Stavke Modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  //Stavke Modal N
  const [modalVisibleN, setModalVisibleN] = useState<boolean>(false);
  const [currentIdN, setCurrentIdN] = useState<number | null>(null);

  // PT Modal
  const [isDialogVisiblePrihodi, setIsDialogVisiblePrihodi] = useState(false);
  const [isDialogVisibleWolt, setIsDialogVisibleWolt] = useState(false);
  const [isDialogVisibleGlovo, setIsDialogVisibleGlovo] = useState(false);
  const [isDialogVisibleSale, setIsDialogVisibleSale] = useState(false);
  const [isDialogVisibleKartice, setIsDialogVisibleKartice] = useState(false);
  const [isDialogVisibleTroskovi, setIsDialogVisibleTroskovi] = useState(false);
  const [isDialogVisibleVirman, setIsDialogVisibleVirman] = useState(false);

  // ================================================================================================================
  // ================================================================================================================


  // DATABASE
  // ================================================================================================================
  // ================================================================================================================
 
  useFocusEffect(
    useCallback(() => {
      fetchData()
      checkForPrvaSmena(today)
    }, [])
    );

  const database = useSQLiteContext();

  const fetchData = async () => {
    try {
      const resultPice = await database.getAllAsync<Pice>("SELECT * FROM pice WHERE deleted = 'false'");
      setPiceData(resultPice);

      const resultStavka = await database.getAllAsync<Stavka_Popisa>(`
      SELECT * FROM stavka_popisa WHERE id_popis = (SELECT MAX(id_popis) FROM popis);
    `);
    setstavkaData(resultStavka);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };


  
  const logInventoryChange = async (
    id_pice: number,
    id_korisnik: number,
    column: string,
    old_value: number,
    new_value: number
  ): Promise<void> => {  
    try {
      const localTimestamp = new Date().toLocaleString("en-US", { timeZone: "Europe/Belgrade" });
      await database.runAsync(`
      INSERT INTO change_history (
        id_pice,
        id_korisnik,
        column,
        old_value,
        new_value,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?);
    `, [id_pice, id_korisnik, column, old_value, new_value, localTimestamp]); 
    } catch (error) {
      console.error('Transaction error:', error);
    }
  };
  // ================================================================================================================
  // ================================================================================================================

  // USEEFFECT
  // ================================================================================================================
  // ================================================================================================================
  const [appWasLeft, setAppWasLeft] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Load saved inputValues from AsyncStorage on mount
  useEffect(() => {
    const loadInputValues = async () => {
      try {
        const savedInputValues = await AsyncStorage.getItem('inputValues');
        const lastActiveTimestamp = await AsyncStorage.getItem('lastActiveTimestamp');
        
        // Check if the app was closed (you can adjust the time threshold as needed)
        const now = new Date().getTime();
        const lastActive = lastActiveTimestamp ? parseInt(lastActiveTimestamp) : 0;
        const timeDifference = now - lastActive;
        
        // If more than 1 hour has passed or no timestamp exists, consider it a new session
        // 1 Second = 1000
        if (timeDifference > 1000 || !lastActiveTimestamp) {
          setAppWasLeft(true);
          // Clear the stored values
          await AsyncStorage.removeItem('inputValues');
        } else if (savedInputValues) {
          setInputValues(JSON.parse(savedInputValues));
        }
      } catch (error) {
        console.error('Error loading inputValues:', error);
      }
    };
    loadInputValues();
  }, []);

  // Save inputValues and timestamp to AsyncStorage on unmount
  useEffect(() => {
    return () => {
      const saveInputValues = async () => {
        try {
          await AsyncStorage.setItem('inputValues', JSON.stringify(inputValues));
          await AsyncStorage.setItem('lastActiveTimestamp', new Date().getTime().toString());
        } catch (error) {
          console.error('Error saving inputValues:', error);
        }
      };
      saveInputValues();
    };
  }, [inputValues]);

  // Initialize inputValues with only pocetak values
  useEffect(() => {
    const initialValues: InputValues = {};
    const initialOldValues: { [key: number]: number } = {};

    piceData.forEach((item) => {
      const stavka = stavkaData.find((stavka) => stavka.id_pice === item.id_pice);
      const evaluatedValue = stavka?.krajnje_stanje 
      ? eval(stavka.krajnje_stanje.toString()).toString() 
      : '0'
      const originalValue = parseFloat(evaluatedValue);

      initialValues[item.id_pice] = {
        pocetak: evaluatedValue || '',
        uneto: appWasLeft ? '' : (inputValues[item.id_pice]?.uneto || ''),
        kraj: appWasLeft ? '' : (inputValues[item.id_pice]?.kraj || ''),
      };

      // Store original value as old value
      initialOldValues[item.id_pice] = originalValue;
    });

    setInputValues(initialValues);
    setOldValuePocetak(initialOldValues);

    if (appWasLeft) {
      setAppWasLeft(false);
    }
  }, [piceData, stavkaData, appWasLeft]);

  // Initialize inputValues with only pocetak values
  useEffect(() => {
    const initialValues: InputValues = {};
    piceData.forEach((item) => {
      const stavka = stavkaData.find((stavka) => stavka.id_pice === item.id_pice);
      const evaluatedValue = stavka?.krajnje_stanje 
      ? eval(stavka.krajnje_stanje.toString()).toString() 
      : '0'

      initialValues[item.id_pice] = {
        pocetak: evaluatedValue || '',
        uneto: inputValues[item.id_pice]?.uneto || '', // Restore uneto if it exists
        kraj: inputValues[item.id_pice]?.kraj || '', // Restore kraj if it exists
      };
    });
    setInputValues(initialValues);
  }, [piceData, stavkaData]);
  

  // ================================================================================================================
  // ================================================================================================================

  // INPUTES LOGIC
  // ================================================================================================================
  // ================================================================================================================

  const handleInputChange = (id_pice: number, field: keyof InputValues[number], value: string) => {
    const inputKey = `${id_pice}-${field}`;
    setTouchedInputs(prev => new Set(prev).add(inputKey));
    
    setInputValues((prev) => ({
      ...prev,
      [id_pice]: {
        ...prev[id_pice],
        [field]: value,
      },
    }));
  };

  const [oldValuePocetak, setOldValuePocetak] = useState<{ [key: number]: number }>({});
  const [oldValueUneto, setOldValueUneto] = useState<{ [key: number]: number }>({});

  const handleBlur = (item: Pice, currentValue: string, column: string) => {
    // console.log("handleBlur called with:", { currentValue, column });
    
    const id_pice = item.id_pice;
    const numericValue = parseFloat(currentValue) || 0;
    // console.log("numericValue:", numericValue);
    
    let previousValue;
    let setOldValueFunction;
    
    if (column === "Početak") {
      previousValue = oldValuePocetak[id_pice] ?? 0;
      setOldValueFunction = setOldValuePocetak;
    } else if (column === "Uneto") {
      previousValue = oldValueUneto[id_pice] ?? 0;
      setOldValueFunction = setOldValueUneto;
    } else {
      console.error("Invalid column:", column);
      return;
    }
    
    // console.log("previousValue:", previousValue);
    
    // Only log if there's an actual change and we have user data
    if (numericValue !== previousValue && userData) {
      // console.log("Value changed. Logging inventory change...");
      logInventoryChange(
        id_pice,
        userData.id_korisnik,
        column,
        previousValue,
        numericValue
      );
      
      // Update the state AFTER logging the change
      setOldValueFunction(prev => ({
        ...prev,
        [id_pice]: numericValue
      }));
    } else {
      console.log("No change detected or userData is missing.");
    }
  };

  // ================================================================================================================
  // ================================================================================================================

  // DIALOG
  // ================================================================================================================
  // ================================================================================================================

  const handleDialogPress = (id: number) => {
    setCurrentId(id);
    setModalVisible(true);
  };

  const handleDialogConfirm = (value: string) => {
    if (currentId !== null) {
      handleInputChange(currentId, 'kraj', value);
    }
    setModalVisible(false);
  };

  const handleDialogPressN = (id: number) => {
    setCurrentIdN(id);
    setModalVisibleN(true);
  };

  const handleDialogConfirmN = (value: string) => {
    if (currentIdN !== null) {
      handleInputChange(currentIdN, 'uneto', value);
    }
    setModalVisibleN(false);
  };

  const calculateSum = (expression: string): number => {
    if (!expression) return 0;
    const numbers = expression.split('+').map(Number);
    return numbers.reduce((acc, num) => acc + num, 0);
  };

  const calculateTotalSum = () => {
    return piceData.reduce((total, item) => {
      const pocetak = parseFloat(inputValues[item.id_pice]?.pocetak || '0');
      const uneto = parseFloat(inputValues[item.id_pice]?.uneto || '0');
      const kraj = calculateSum(inputValues[item.id_pice]?.kraj || '0');
      
      const prodato = item.type === "other" 
        ? (kraj - pocetak) 
        : (uneto + pocetak) - kraj;
      
      const ukupno = prodato * parseFloat(item.cena);
      
      return total + ukupno;
    }, 0);
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
  

  const handleChangePrihodi = (value: string) => {
    // console.log('Saving Prihodi value to PTInptus:', value);
    setPTInptus((prev) => ({ ...prev, ostalop: value }));
  };
  
  const handleChangeWolt = (value: string) => {
    // console.log('Saving Troskovi value to PTInptus:', value);
    setPTInptus((prev) => ({ ...prev, wolt: value }));
  };

  const handleChangeGlovo = (value: string) => {
    // console.log('Saving Troskovi value to PTInptus:', value);
    setPTInptus((prev) => ({ ...prev, glovo: value }));
  };

  const handleChangeSale = (value: string) => {
    // console.log('Saving Troskovi value to PTInptus:', value);
    setPTInptus((prev) => ({ ...prev, sale: value }));
  };

  const handleChangeKartice = (value: string) => {
    // console.log('Saving Troskovi value to PTInptus:', value);
    setPTInptus((prev) => ({ ...prev, kartice: value }));
  };

  const handleChangeTroskovi = (value: string) => {
    // console.log('Saving Troskovi value to PTInptus:', value);
    setPTInptus((prev) => ({ ...prev, ostalot: value }));
  };

  const handleChangeVirman = (value: string) => {
    // console.log('Saving Virman value to PTInptus:', value);
    setPTInptus((prev) => ({ ...prev, virman: value }));
  };

  const handleOpenDialogPrihodi = () => setIsDialogVisiblePrihodi(true);
  const handleCloseDialogPrihodi = () => setIsDialogVisiblePrihodi(false);

  
  const handleOpenDialogWolt = () => setIsDialogVisibleWolt(true);
  const handleCloseDialogWolt = () => setIsDialogVisibleWolt(false);

  const handleOpenDialogGlovo = () => setIsDialogVisibleGlovo(true);
  const handleCloseDialogGlovo = () => setIsDialogVisibleGlovo(false);

  const handleOpenDialogSale = () => setIsDialogVisibleSale(true);
  const handleCloseDialogSale = () => setIsDialogVisibleSale(false);

  const handleOpenDialogKartice = () => setIsDialogVisibleKartice(true);
  const handleCloseDialogKartice = () => setIsDialogVisibleKartice(false);

  const handleOpenDialogTroskovi = () => setIsDialogVisibleTroskovi(true);
  const handleCloseDialogTroskovi = () => setIsDialogVisibleTroskovi(false);
  
  const handleOpenDialogVirman = () => setIsDialogVisibleVirman(true);
  const handleCloseDialogVirman = () => setIsDialogVisibleVirman(false);


  

  // ================================================================================================================
  // ================================================================================================================

  // POPIS HANDLE
  // ================================================================================================================
  // ================================================================================================================

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

  const validateInputs = async () => {
    const errors: string[] = [];
  
    // Validate Smena
    if (!otherInputs.smena) {
      errors.push('Morate izabrati smenu (prva ili druga).');
    }
  
    if (otherInputs.smena) {
      const today = new Date().toISOString().split('T')[0];
      const existingPopis = await checkExistingPopis(today, otherInputs.smena);
  
      if (existingPopis) {
        errors.push(`Već postoji ${otherInputs.smena} smena na današnji datum.`);
      }
    }
  
    // Validate Pice Table Calculations
    piceData.forEach(item => {
      const pocetak = parseFloat(inputValues[item.id_pice]?.pocetak || '0');
      const uneto = parseFloat(inputValues[item.id_pice]?.uneto || '0');
      const kraj = calculateSum(inputValues[item.id_pice]?.kraj || '0');
      const prodato = (uneto + pocetak) - kraj;
      const ukupno = prodato * parseFloat(item.cena);

      const prodato_other = (kraj - pocetak);
      const ukupno_other = prodato_other * parseFloat(item.cena);

      if (item.type !== "other" && ukupno < 0) {
        errors.push(`Ukupno za ${item.naziv} ne može biti negativno.`);
      }
      if(item.type === "other" && ukupno_other < 0){
         errors.push(`Ukupno za ${item.naziv} ne može biti negativno.`);
      }
    });
  
    // Validate PTInputs (Prihodi i Troškovi)
    const numericInputs: (keyof PrihodiTroskoviInputs)[] = [
      'kuhinja', 'ks', 'ostalop', 
      'wolt', 'glovo', 'sale', 
      'kartice', 'ostalot', 'virman'
    ];
  
    numericInputs.forEach(field => {
      const value = parseFloat(PTInptus[field] || '0');
      if (value < 0) errors.push(`Polje ${field} ne može biti negativno.`);
    });
  
    // Display all errors at once if any exist
    if (errors.length > 0) {
      Alert.alert(
        'Greške',
        errors.map((error, index) => `${index + 1}. ${error}`).join('\n')
      );
      return false;
    }
  
    return true;
  };

  const fieldLabels: Record<keyof PrihodiTroskoviInputs, string> = {
    kuhinja: "Kuhinja", ks: "Kuhinja Storno", ostalop: "Ostali prihodi",
    ostalopOpis: "Ostali prihodi - Opis", wolt: "Wolt", glovo: "Glovo",
    sale: "Sale", kartice: "Kartice", ostalot: "Ostali troškovi", virman: "Virman", 
    ostalotOpis: "Ostali troškovi - Opis", virmanOpis: "Virman - Opis",
  };
  
  const validatePrihodiTroskoviInputs = (PTInputs: PrihodiTroskoviInputs, callback: () => void) => {
    const emptyFields = Object.entries(PTInputs)
      .filter(([_, value]) => value.trim() === "")
      .map(([key]) => fieldLabels[key as keyof PrihodiTroskoviInputs] || key); // Convert to user-friendly labels
  
    if (emptyFields.length > 0) {
      Alert.alert(
        "Upozorenje",
        `Neka polja nisu popunjena:\n\n${emptyFields.join("\n")}\n\nAko ne popunite polja, zapamtiće se podrazumevana vrednost. Da li želite da nastavite?`,
        [
          { text: "Ne", style: "cancel" },
          { text: "Da", onPress: callback }
        ]
      );
    } else {
      callback();
    }
  };
  
  const popisConfirm = () => {
    validatePrihodiTroskoviInputs(PTInptus, () => {
      Alert.alert(
        "Potvrda dodavanja",
        "Da li želite da završite popis? Upozorenje: Ako završite popis za današnji datum i trenutnu smenu, nećete moći da završite ponovo za istu smenu.",
        [{ text: "Ne", style: "cancel" }, { text: "Da", onPress: async () => handleZavrsiPopis() }]
      );
    });
  };


  const handleZavrsiPopis = async () => {
    const isValid = await validateInputs();
    if(isValid){
      // DEBUG
      // console.log("Popis Confirmed! Here are the input values:");
      // console.log(JSON.stringify(inputValues, null, 2));
      // console.log("Prihodi & Troskovi Inputs:");
      // console.log(JSON.stringify(PTInptus, null, 2));
      // console.log("Other Inputs:");
      // console.log(JSON.stringify(otherInputs, null, 2));
      // const test1 = new Date().toISOString().split('T')[0]
      // const test = new Date().toLocaleString("en-GB", { timeZone: "Europe/Belgrade" }).split('T')[0];
      // console.log("Datum new Date: " + test )
      // console.log("Datum new Date no Belgrade: " + test1)
      try {
        const result = await database.runAsync(`
          INSERT INTO popis (
            datum, kuhinja, kuhinjaSt, ostalop,
            ostalopOpis, wolt, glovo, kartice,
            sale, ostalot, ostalotOpis, virman,
            virmanOpis, smena, id_korisnik
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          new Date().toISOString().split('T')[0], PTInptus.kuhinja || "0", PTInptus.ks || "0", PTInptus.ostalop || "0",
          PTInptus.ostalopOpis, PTInptus.wolt || "0", PTInptus.glovo || "0", PTInptus.kartice || "0",
          PTInptus.sale || "0", PTInptus.ostalot || "0", PTInptus.ostalotOpis, PTInptus.virman || "0",
          PTInptus.virmanOpis, otherInputs.smena, Number(userData?.id_korisnik)
        ]);
  
        const insertId = result.lastInsertRowId;
  
        // Insert Stavke Popisa
        for (const item of piceData) {
          const inputValue = inputValues[item.id_pice];
          if (!inputValue) continue;
  
          const pocetak = parseFloat(inputValue.pocetak || '0');
          const uneto = parseFloat(inputValue.uneto || '0');
          const kraj_string = inputValue.kraj || '0'
          const kraj = calculateSum(inputValue.kraj || '0');
          let prodato = (uneto + pocetak) - kraj;
          let ukupno = prodato * parseFloat(item.cena);

          const prodato_other = (kraj - pocetak);
          const ukupno_other = prodato_other * parseFloat(item.cena);

          if (item.type === "other") {
            const prodato_other = (kraj - pocetak);
            const ukupno_other = prodato_other * parseFloat(item.cena);
            prodato = prodato_other; 
            ukupno = ukupno_other;
          } else {
            prodato = (uneto + pocetak) - kraj;
            ukupno = prodato * parseFloat(item.cena);
          }
  
          // console.log("Ubacuje se Stavka... " + item.naziv)
          // console.log("ID Popis: " + insertId)
          // console.log("Pocetak: " + pocetak)
          // console.log("Uneto: " + uneto)
          // console.log("Kraj: " + kraj)
          // console.log("Kraj Stirng: " + kraj_string)
          // console.log("prodato: " + prodato)
          // console.log("ukupno: " + ukupno)
  
          await database.runAsync(
            `INSERT INTO stavka_popisa (
              id_popis, pocetno_stanje, uneto,
              krajnje_stanje, prodato,
              ukupno, id_pice
            ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
              insertId, pocetak, uneto,
              kraj_string,
              prodato,
              ukupno,
              item.id_pice
            ]
          );
        }

        Alert.alert(
          'Adding Success',
          'Popis je uspešno sačuvan! Aplikacija će se resetovati kako bi se sačuvale promene.',
          [{ text: "OK", onPress: async () => {
            await setUserData(null);
            router.replace('/');
          }}]
        );

        // RESET INPUT VALUES 
        const initialValues: InputValues = {};
        piceData.forEach((item) => {
          const stavka = stavkaData.find((stavka) => stavka.id_pice === item.id_pice);
          initialValues[item.id_pice] = {
            pocetak: stavka?.krajnje_stanje || '',
            uneto: '', // Restore uneto if it exists
            kraj: '', // Restore kraj if it exists
          };
        });
        setInputValues(initialValues);

      } catch (error) {
        console.error("Error inserting Popis:", error);
        Alert.alert("Greška", "Došlo je do greške prilikom čuvanja popisa.");
      }
    }


  };

  // ================================================================================================================
  // ================================================================================================================
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#FFA001" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="flex bg-secondary rounded-3xl m-4 mb-2 p-4">
          {/* Header Buttons */}
          {userData?.role === "admin" ? (
            <>
            <TouchableOpacity
            className="absolute bottom-4 right-4 bg-secondary rounded-md items-center"
            onPress={logoutConfirm}
            >
              <AntDesign name="logout" size={42} color="#AA0000" />
            </TouchableOpacity>
            <TouchableOpacity
            className="absolute top-4 right-6 bg-secondary rounded-md items-center"
            onPress={() => router.push("/changeLogs")}
            >
              <FontAwesome5 name="bookmark" size={42} color="#FFA500" />
            </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
            className="absolute top-4 right-4 bg-secondary rounded-md items-center"
            onPress={logoutConfirm}
            >
              <AntDesign name="logout" size={46} color="#AA0000" />
            </TouchableOpacity>
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

      {/* Content */}
      {["piece", "liters", "kilograms", "other"].map((type) => (
        <View key={type} className="mb-6 mx-4 border border-gray-300 rounded-lg shadow-md bg-white">
          {/* Table Title */}
          <View className="bg-secondary rounded-t-lg p-4">
            <Text className="text-orange text-2xl font-bold text-center">
              Stavke Popisa [{type === "piece" ? "kom" : type === "liters" ? "ml" : type === "kilograms" ? "g" : "Ostalo"}]
            </Text>
          </View>

          <ScrollView keyboardShouldPersistTaps='handled' horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header */}
              <View className="flex-row bg-gray-200 border-b-2 border-black py-3">
                <Text className="w-32 text-center text-l font-bold">Naziv</Text>
                <Text className="w-24 text-center text-l font-bold">Početak</Text>
                <Text className="w-24 text-center text-l font-bold">Uneto</Text>
                <Text className="w-24 text-center text-l font-bold">Kraj</Text>
                <Text className="w-24 text-center text-l font-bold">Prodato</Text>
                <Text className="w-24 text-center text-l font-bold">Cena</Text>
                <Text className="w-28 text-center text-l font-bold">Ukupno</Text>
              </View>

              {/* Table Rows */}
              {piceData.filter((item) => item.type === type).map((item) => {
                const pocetak = parseFloat(inputValues[item.id_pice]?.pocetak || '0');
                const uneto = parseFloat(inputValues[item.id_pice]?.uneto || '0');
                const kraj = calculateSum(inputValues[item.id_pice]?.kraj || '0');
                const prodato = (uneto + pocetak) - kraj;
                const ukupno = prodato * parseFloat(item.cena);
                const prodato_other = (kraj - pocetak);
                const ukupno_other = prodato_other * parseFloat(item.cena);

                return (
                  <View key={item.id_pice} className={`flex-row items-center border-b py-2`}>
                    {/* Naziv */}
                    <Text className="w-32 text-center text-lg">{item.naziv}</Text>

                    {/* Početak Input */}
                    {userData?.role === "admin" || userData?.role === "manager" ? (
                      <TextInput
                        className="w-24 text-center border border-gray-400 rounded-md px-2 py-2 text-lg bg-gray-100"
                        keyboardType="number-pad"
                        placeholder="0"
                        value={inputValues[item.id_pice]?.pocetak}
                        onChangeText={(value) => handleInputChange(item.id_pice, "pocetak", value)}
                        onBlur={() => handleBlur(item, inputValues[item.id_pice]?.pocetak, "Početak")}
                      />
                    ) : (
                      <Text className="w-24 text-center text-lg">{inputValues[item.id_pice]?.pocetak || "0"}</Text>
                    )}

                    {/* Uneto Input */}
                    {type === "other" ? (
                      <Text className="w-24 text-center text-lg">N/A</Text>
                    ) : (
                      <>
                        <TouchableOpacity
                          className="w-24 text-center border border-gray-400 rounded-md px-2 py-2 text-lg bg-gray-100 justify-center items-center"
                          onPress={() => handleDialogPressN(item.id_pice)}
                        >
                          <Text className="text-lg">{(inputValues[item.id_pice]?.uneto || '0').toString()}</Text>
                        </TouchableOpacity>

                        <DialogModalN
                          visible={modalVisibleN && currentIdN === item.id_pice}
                          onClose={() => {
                            setModalVisibleN(false);
                            // Get the current value from inputValues instead of using a local value
                            const currentValue = inputValues[item.id_pice]?.uneto || '0';
                            handleBlur(item, currentValue, 'Uneto');
                          }}
                          onConfirm={(value) => {
                            handleDialogConfirmN(value);
                            // Call handleBlur with the new value immediately after confirming
                            handleBlur(item, value, 'Uneto');
                          }}
                          initialValue={inputValues[item.id_pice]?.uneto || ''}
                        />
                      </>
                    )}

                    {/* Kraj Input */}
                    <TouchableOpacity
                      className="w-24 text-center border border-gray-400 rounded-md px-2 py-2 text-lg bg-gray-100 justify-center items-center"
                      onPress={() => handleDialogPress(item.id_pice)}
                    >
                      <Text className="text-lg">{calculateSum(inputValues[item.id_pice]?.kraj || '0').toString()}</Text>
                    </TouchableOpacity>

                    <DialogModal
                      visible={modalVisible && currentId === item.id_pice}
                      onClose={() => setModalVisible(false)}
                      onConfirm={handleDialogConfirm}
                      initialValue={inputValues[item.id_pice]?.kraj || ''}
                    />
                    
                    {/* Prodato */}
                    <Text className="w-24 text-center text-lg">
                      {type === "other" ? Math.max(0, prodato_other).toString() || "0" : Math.max(0, prodato).toString() || "0"}
                    </Text>

                    {/* Cena */}
                    <Text className="w-24 text-center text-lg">{item.cena}</Text>

                    {/* Ukupno */}
                    <Text className="w-28 text-center text-lg font-bold">
                      {type === "other" ? Math.max(0, parseFloat(ukupno_other.toFixed(2))).toString() || "0" : Math.max(0, parseFloat(ukupno.toFixed(2))).toString() || "0"} RSD
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ))}


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
              value={PTInptus.kuhinja}
              onChangeText={(value: string) =>
                setPTInptus((prev) => ({ ...prev, kuhinja: value }))
              }
              placeholder="Unesi kuhinju..."
            />
          </View>
          <View className="flex-1 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Kuhinja Storno</Text>
            <TextInput
              className="h-14 border border-gray-400 rounded px-2"
              keyboardType="number-pad"
              value={PTInptus.ks}
              onChangeText={(value: string) =>
                setPTInptus((prev) => ({ ...prev, ks: value }))
              }
              placeholder="Unesi KS..."
            />
          </View>
        </View>

        <View className="flex flex-row py-2 border-b border-black">
          <View className="w-1/3 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Ostali Prihodi</Text>
            <TouchableOpacity className='h-14 border border-gray-400 rounded px-2 justify-center items-start' onPress={handleOpenDialogPrihodi}>
            <Text className={PTInptus.ostalop === "" ? "text-gray-400" : "text-black"}>
              {PTInptus.ostalop === "" 
                ? "Unesi prihode..." 
                : PTInptus.ostalop.split('+')
                    .map(num => parseInt(num, 10))
                    .reduce((sum, num) => sum + num, 0)
                    .toString()
              }
            </Text>
            </TouchableOpacity>
            <PTDialogModal
              initialValue={PTInptus.ostalop}
              onConfirm={handleChangePrihodi}
              onClose={handleCloseDialogPrihodi}
              isVisible={isDialogVisiblePrihodi}
            />
          </View>
          <View className="w-2/3 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Ostali Prihodi Opis</Text>
            <TextInput
              className="h-14 border border-gray-400 rounded px-2"
              value={PTInptus.ostalopOpis}
              onChangeText={(value: string) =>
                setPTInptus((prev) => ({ ...prev, ostalopOpis: value }))
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
            <TouchableOpacity className='h-14 border border-gray-400 rounded px-2 justify-center items-start' onPress={handleOpenDialogWolt}>
            <Text className={PTInptus.wolt === "" ? "text-gray-400" : "text-black"}>
            {PTInptus.wolt === "" 
              ? "Unesi wolt..." 
              : PTInptus.wolt.split('+')
                  .map(num => parseInt(num, 10))
                  .reduce((sum, num) => sum + num, 0)
                  .toString()
              }
            </Text>
            </TouchableOpacity>
            <PTDialogModal
              initialValue={PTInptus.wolt}
              onConfirm={handleChangeWolt}
              onClose={handleCloseDialogWolt}
              isVisible={isDialogVisibleWolt}
            />
          </View>
          <View className="flex-1 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Glovo</Text>
            <TouchableOpacity className='h-14 border border-gray-400 rounded px-2 justify-center items-start' onPress={handleOpenDialogGlovo}>
            <Text className={PTInptus.glovo === "" ? "text-gray-400" : "text-black"}>
            {PTInptus.glovo === "" 
              ? "Unesi glovo..." 
              : PTInptus.glovo.split('+')
                  .map(num => parseInt(num, 10))
                  .reduce((sum, num) => sum + num, 0)
                  .toString()
              }
            </Text>
            </TouchableOpacity>
            <PTDialogModal
              initialValue={PTInptus.glovo}
              onConfirm={handleChangeGlovo}
              onClose={handleCloseDialogGlovo}
              isVisible={isDialogVisibleGlovo}
            />
          </View>
        </View>

        <View className="flex flex-row py-2 border-b border-black">
          <View className="flex-1 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Sale</Text>
            <TouchableOpacity className='h-14 border border-gray-400 rounded px-2 justify-center items-start' onPress={handleOpenDialogSale}>
            <Text className={PTInptus.sale === "" ? "text-gray-400" : "text-black"}>
            {PTInptus.sale === "" 
              ? "Unesi sale..." 
              : PTInptus.sale.split('+')
                  .map(num => parseInt(num, 10))
                  .reduce((sum, num) => sum + num, 0)
                  .toString()
              }
            </Text>
            </TouchableOpacity>
            <PTDialogModal
              initialValue={PTInptus.sale}
              onConfirm={handleChangeSale}
              onClose={handleCloseDialogSale}
              isVisible={isDialogVisibleSale}
            />
          </View>
          <View className="flex-1 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Kartice</Text>
            <TouchableOpacity className='h-14 border border-gray-400 rounded px-2 justify-center items-start' onPress={handleOpenDialogKartice}>
            <Text className={PTInptus.kartice === "" ? "text-gray-400" : "text-black"}>
            {PTInptus.kartice === "" 
              ? "Unesi kartice..." 
              : PTInptus.kartice.split('+')
                  .map(num => parseInt(num, 10))
                  .reduce((sum, num) => sum + num, 0)
                  .toString()
              }
            </Text>
            </TouchableOpacity>
            <PTDialogModal
              initialValue={PTInptus.kartice}
              onConfirm={handleChangeKartice}
              onClose={handleCloseDialogKartice}
              isVisible={isDialogVisibleKartice}
            />
          </View>
        </View>

          {/* Fourth Row: Ostalo and Ostalo Opis */}
        <View className="flex flex-row py-2 border-b border-black">
          <View className="w-1/3 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Ostali Troškovi</Text>
            <TouchableOpacity className='h-14 border border-gray-400 rounded px-2 justify-center items-start' onPress={handleOpenDialogTroskovi}>
            <Text className={PTInptus.ostalot === "" ? "text-gray-400" : "text-black"}>
              {PTInptus.ostalot === "" 
                ? "Unesi troškove..." 
                : PTInptus.ostalot.split('+')
                    .map(num => parseInt(num, 10))
                    .reduce((sum, num) => sum + num, 0)
                    .toString()
              }
            </Text>
            </TouchableOpacity>
            <PTDialogModal
              initialValue={PTInptus.ostalot}
              onConfirm={handleChangeTroskovi}
              onClose={handleCloseDialogTroskovi}
              isVisible={isDialogVisibleTroskovi}
            />
          </View>
          <View className="w-2/3 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Ostali Troškovi Opis</Text>
            <TextInput
              className="h-14 border border-gray-400 rounded px-2"
              value={PTInptus.ostalotOpis}
              onChangeText={(value: string) => 
                setPTInptus(prev => ({ ...prev, ostalotOpis: value }))
              }
              placeholder="Unesi opis..."
            />
          </View>
        </View>

          {/* Fifth Row: Virman and Virman Opis */}
        <View className="flex flex-row py-2 border-b border-black">
          <View className="w-1/3 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Virman</Text>
            <TouchableOpacity className='h-14 border border-gray-400 rounded px-2 justify-center items-start' onPress={handleOpenDialogVirman}>
            <Text className={PTInptus.virman === "" ? "text-gray-400" : "text-black"}>
              {PTInptus.virman === "" 
                ? "Unesi virmane..." 
                : PTInptus.virman.split('+')
                    .map(num => parseInt(num, 10))
                    .reduce((sum, num) => sum + num, 0)
                    .toString()
              }
            </Text>
            </TouchableOpacity>
            <PTDialogModal
              initialValue={PTInptus.virman}
              onConfirm={handleChangeVirman}
              onClose={handleCloseDialogVirman}
              isVisible={isDialogVisibleVirman}
            />
          </View>
          <View className="w-2/3 px-2">
            <Text className="text-left pl-1 font-semibold mb-1">Virman Opis</Text>
            <TextInput
              className="h-14 border border-gray-400 rounded px-2"
              value={PTInptus.virmanOpis}
              onChangeText={(value: string) => 
                setPTInptus(prev => ({ ...prev, virmanOpis: value }))
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
              selectedValue={otherInputs.smena}
              onValueChange={(itemValue) =>
                setOtherInputs(prev => ({ ...prev, smena: itemValue }))
              }
              className="h-12"
            >
              <Picker.Item label= "[Smena]" enabled={false} value="" style={{ color: 'black' }}/>
              <Picker.Item label="Prva smena" value="prva" enabled={prvaSmenaEnabled}  style={{ color: prvaSmenaEnabled ? 'black' : 'gray' }}/> 
              <Picker.Item label="Druga smena" value="druga" enabled={drugaSmenaEnabled}  style={{ color: drugaSmenaEnabled ? 'black' : 'gray' }} />
            </Picker>
          </View>
      </View>
        <View className="space-y-4">
          {/* Pazar Row */}
          <View className="flex flex-row justify-between items-center border-b border-gray-300 pb-2">
            <Text className="text-lg font-bold">Piće:</Text>
            <Text className="text-lg">
            {Math.max(0, parseFloat(calculateTotalSum().toFixed(2))).toString()} RSD
            </Text>
          </View>
          
          {/* Prihodi Row */}
          <View className="flex flex-row justify-between items-center border-b border-gray-300 pb-2">
            <Text className="text-lg font-bold">Prihodi:</Text>
            <Text className="text-lg">
              {((
                parseInt(PTInptus.kuhinja || "0") + 
                parseInt(PTInptus.ks || "0") + 
                parseInt(evaluateExpression(PTInptus.ostalop) || "0")
              ).toFixed(2))} RSD
            </Text>
          </View>
          
          {/* Troškovi Row */}
          <View className="flex flex-row justify-between items-center border-b border-gray-300 pb-2">
            <Text className="text-lg font-bold">Troškovi:</Text>
            <Text className="text-lg">
              - {((
                parseInt(evaluateExpression(PTInptus.wolt) || "0") + 
                parseInt(evaluateExpression(PTInptus.glovo) || "0") + 
                parseInt(evaluateExpression(PTInptus.sale) || "0") + 
                parseInt(evaluateExpression(PTInptus.kartice) || "0") + 
                parseInt( evaluateExpression(PTInptus.ostalot) || "0") + 
                parseInt( evaluateExpression(PTInptus.virman) || "0")
                ).toFixed(2))} RSD
            </Text>
          </View>
          
          {/* Ukupno Row */}
          <View className="flex flex-row justify-between items-center pt-2">
            <Text className="text-xl font-bold">Ukupno:</Text>
            <Text className="text-xl font-bold text-secondary">
              {(
                Math.max(
                  0, // Ensure the result is never less than 0
                  calculateTotalSum() + 
                  (parseInt(PTInptus.kuhinja || "0") + 
                  parseInt(PTInptus.ks || "0") + 
                  parseInt(evaluateExpression(PTInptus.ostalop) || "0")) - 
                  (parseInt(evaluateExpression(PTInptus.wolt) || "0") + 
                  parseInt(evaluateExpression(PTInptus.glovo) || "0") + 
                  parseInt(evaluateExpression(PTInptus.sale) || "0") + 
                  parseInt(evaluateExpression(PTInptus.kartice) || "0") + 
                  parseInt(evaluateExpression(PTInptus.ostalot)|| "0") + 
                  parseInt(evaluateExpression(PTInptus.virman) || "0"))
                ).toFixed(2)
              ).toString()} RSD
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>

      {/* Dialog Modal */}

  </SafeAreaView>
  );
};

export default Popis;