import { View, Text } from 'react-native'
import { Tabs, Redirect } from 'expo-router'
// Imports for icons
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#FFA001',
          tabBarInactiveTintColor: '#CDCDE0',
          tabBarStyle: {
            backgroundColor: '#393B44',
            borderTopWidth: 1,
            borderTopColor: '',
            height: 84,
            paddingTop: 6,
          }
        }}
      >
        <Tabs.Screen name='popis' options={{
          title: 'Popis',
          headerShown: false,
          tabBarIcon: ({color}) => (
            <AntDesign name="pluscircle" size={24} color={color} />
          )
        }}/>
        <Tabs.Screen name='vidiPopis' options={{
          title: "Vidi Popis",
          headerShown: false,
          tabBarIcon: ({color}) => (
            <Ionicons name="newspaper" size={24} color={color} />
          )
        }}/>
        <Tabs.Screen name='radnici' options={{
          title: "Radnici",
          headerShown: false,
          tabBarIcon: ({color}) => (
            <Ionicons name="person" size={24} color={color} />
          )
        }}/>
        <Tabs.Screen name='proizvodi' options={{
          title: "Piće",
          headerShown: false,
          tabBarIcon: ({color}) => (
            <FontAwesome name="glass" size={24} color={color} />
          )
        }}/>
      </Tabs>
    </>
  )
}

export default TabsLayout