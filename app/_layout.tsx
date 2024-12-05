import { StyleSheet, Text, View } from 'react-native'
// Need to see Slot
import { Stack } from 'expo-router'
import "../global.css";

const RootLayout = () => {
  return (
    <Stack>
        <Stack.Screen name='index' options={{ headerShown: false }}/>
        <Stack.Screen name='(auth)' options={{ headerShown: false }}/>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }}/>
    </Stack>
  )
}

export default RootLayout

const styles = StyleSheet.create({})