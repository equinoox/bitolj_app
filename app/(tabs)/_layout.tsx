import { Tabs } from 'expo-router'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';

import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Feather } from '@expo/vector-icons';

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
            paddingBottom: 6,
          },
          tabBarItemStyle: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            marginTop: 4,
            fontSize: 12,
            lineHeight: 16,
          },
          tabBarIconStyle: {
            marginBottom: 0,
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
        <Tabs.Screen name='opcijePopis' options={{
          title: "Izmeni",
          headerShown: false,
          tabBarIcon: ({color}) => (
            <FontAwesome5 name="edit" size={24} color={color} />
          )
        }}/>
        <Tabs.Screen name='statistika' options={{
          title: "Statistika",
          headerShown: false,
          tabBarIcon: ({color}) => (
            <FontAwesome name="bar-chart" size={24} color={color} />
          )
        }}/>
        <Tabs.Screen name='radnici' options={{
          title: "Opcije",
          headerShown: false,
          tabBarIcon: ({color}) => (
            <Feather name="settings" size={24} color={color} />
          )
        }}/>
      </Tabs>
    </>
  )
}

export default TabsLayout