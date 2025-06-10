import { StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { icons } from '../../constants';

const TabIcon = ({icon, color, name, focused}) => {
  return (
    <View className="items-center justify-center gap-1">
      <Image source={icon}
      marginTop={focused ? 12 : 23}
      resizeMode="contain"
      tintColor={color} 
      className="w-7  h-7" 
      />
      <Text className={'${focused ? "font-psemibold" : "font-pregular"} text-xs'} style={{color: color}}>  
        {name}
      </Text>
    </View>
  )
}


const TabsLayout = () => {
  return (
    <>  
      <Tabs 
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#FFA001",
          tabBarInactiveTintColor: "#CDCDE0",
          tabBarStyle: {
            backgroundColor: "#161622",
            borderTopWidth: 4,
            borderTopColor: "#232533",
            height: 83,
          }
        }}
      >  
        <Tabs.Screen
          name="home"
          options={{
            title:'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.home}
                color={color}
                name="Home "
                focused={focused}
               />
            )
          }}
        />
        
              <Tabs.Screen
          name="create"
          options={{
            title:'Create',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.plus}
                color={color}
                name="Create"
                focused={focused}
               />
            )
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
          title: 'Agenda',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
        <TabIcon
          icon={icons.plus} // Adicione um ícone de calendário em constants/icons.js se ainda não tiver
          color={color}
          name="Agen"
          focused={focused}
        />
      ),
     }}
   />
              <Tabs.Screen
          name="profile"
          options={{
            title:'Profile',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Profile "
                focused={focused}
               />
            )
          }}
        />
      </Tabs>
    </>
  )
};

export default TabsLayout;


