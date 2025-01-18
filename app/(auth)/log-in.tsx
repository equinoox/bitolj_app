import { View, Text, ScrollView, Image, TouchableOpacity, Animated } from 'react-native'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router'
import { Korisnik } from '@/models/Korisnik';
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'



const LogIn = () => {
  
  const [form, setForm] = useState({
    name: '',
    password: ''
  });

  const { setUserData } = useAuth();

  const [error, setError] = useState('');
  const database = useSQLiteContext();
  const [data, setData] = useState<Korisnik[]>([]);
  const loadData = async () => {
    const result = await database.getAllAsync<Korisnik>("SELECT * FROM korisnik WHERE deleted = 'false'; ");
    setData(result);
  }

  useFocusEffect(
  useCallback( () => {
      loadData();
  }, [])
  );

  const bypass = async () => {
    router.replace('/(tabs)/popis');
  }

  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    try {
      setError('');
      
      const selectedUser = data.find(user => user.ime === form.name);
      
      if (!selectedUser) {
        setError('Korisnik nije pronađen.');
        return;
      }

      if (selectedUser.sifra !== form.password) {
        setError('Pogrešna šifra');
        return;
      }

      const userData = {
        id_korisnik: selectedUser.id_korisnik,
        ime: selectedUser.ime,
        prezime: selectedUser.prezime,
        role: selectedUser.role,
      };

      // Save to context (which also saves to SecureStore)
      await setUserData(userData);

      // Navigate to tabs
      router.replace('/(tabs)/popis');

    } catch (error) {
      setError('Došlo je do greške prilikom prijave.');
      console.error('Login error:', error);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full flex">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full justify-center items-center min-h-[54vh] px-4 my-6 flex-1">
          <Animated.Image 
            source={require('../../assets/images/person_icon.png')}
            resizeMode="contain"
            style={{ opacity: imageOpacity }}
            className="max-w-[185px] h-[105px]"
          />
          <Text className="text-2xl text-black font-semibold mt-4 text-center">PRIJAVA KORISNIKA</Text>
          

          <View className="flex-row items-center justify-center mt-4">
              <View className=" w-3/4 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
                <Picker
                  selectedValue={form.name}
                  onValueChange={(itemValue) => setForm({...form, name: itemValue})}
                  style={{ height: 60, width: '100%' }}
                  dropdownIconColor="#6B7280"
                >
                  <Picker.Item label="[Izaberi korisnika]" value=""/>
                {data.map((item) => (
                  <Picker.Item
                    key={item.id_korisnik} 
                    label={`${item.ime} ${item.prezime}`} 
                    value={item.ime}
                  />
                ))}
                </Picker>
              </View>
            </View>
          
          <FormField
            title="Šifra"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7 w-3/4"
            keyboardType="password"
          />
          {error ? (
            <Text className="text-red-500 mt-2">{error}</Text>
          ) : null}
          <TouchableOpacity 
            onPress={handleLogin} 
            className="bg-secondary rounded-xl min-h-[42px] justify-center items-center w-2/4 mt-6 active:opacity-20"
          >
            <Text className="text-white text-2xl font-semibold">Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="bg-secondary_dark py-8 flex-shrink-0">
          <View className="justify-center items-center px-6">
            <Text className="text-text_color_2 text-lg italic">
              <Text className="text-orange font-bold">Restoran Bitolj</Text> @ 2024 All Rights Reserved
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LogIn