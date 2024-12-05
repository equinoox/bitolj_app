import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'


interface InputProps {
    title: string;
    value: string;
    handleChangeText: (e: string) => void;
    otherStyles: string;
    keyboardType: string;
}

const FormField: React.FC<InputProps> = ({ title, value, handleChangeText, otherStyles, keyboardType, ...props}) => {
  
    const [showPassword, setshowPassword] = useState(false)
  
    return (
    <View className={`space-y-2  ${otherStyles}`}>
      <Text className='font-semibold text-lg px-4 mb-1 text-black'>{title}</Text>
      <View className='boreder-2 border-black w-full h-16 px-4 bg-white rounded-2xl 
      focus:border-orange items-center flex-row'>
        <TextInput
            className='flex-1 text-black font-semibold text-base'
            value={value}
            placeholder=""
            placeholderTextColor="#7b7b8b"
            onChangeText={handleChangeText}
            secureTextEntry={title === "Šifra" && !showPassword}
        />
        {title === "Šifra" && (
            <TouchableOpacity onPress={() => setshowPassword(!showPassword)}>
                <Image className='max-w-8 max-h-8' resizeMode='contain' source={!showPassword ? require('../assets/images/eye.png') : require('../assets/images/eye_hide.png')}/>
            </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default FormField