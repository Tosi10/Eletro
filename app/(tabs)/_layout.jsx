import { Text, View, Image, Platform, TouchableOpacity } from 'react-native';
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { icons } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';

// --- Componente de Ícone da Aba (TabIcon) ---
const TabIcon = ({ icon, color, name, focused }) => (
  // Mantém items-center e w-full para centralização horizontal e largura total.
  <View className="items-center w-full"> 
    <Image
      source={icon}
      resizeMode="contain"
      tintColor={color}
      className="w-7 h-7"
      style={{ marginTop: focused ? 12 : 23 }} // Seu marginTop condicional para o alinhamento do ícone
    />
    <Text
      className={`${focused ? "font-psemibold" : "font-pregular"} text-xs mt-1`} // mt-1 para espaçamento ícone-texto
      style={{ color: color }}
      numberOfLines={1} // Garante que o texto não quebre para a próxima linha
    >
      {name}
    </Text>
  </View>
);

// --- Componente para Link de Navegação Web (CustomWebNavLink) ---
const CustomWebNavLink = ({ href, icon, title }) => {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <TouchableOpacity
      onPress={() => router.push(href)}
      className={`flex-row items-center p-3 rounded-lg mb-2 transition-colors ${
        isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
      }`}
    >
      {icon && (
        <Image
          source={icon}
          resizeMode="contain"
          className="w-5 h-5 mr-3"
          tintColor={isActive ? '#FFFFFF' : '#CDCDE0'}
        />
      )}
      <Text className={`text-base font-pmedium ${isActive ? 'text-white' : 'text-gray-200'}`}>{title}</Text>
    </TouchableOpacity>
  );
};

// --- Componente de Layout de Navegação Web (WebNavigationLayout) ---
const WebNavigationLayout = ({ children }) => {
  const { user } = useGlobalContext();

  return (
    <View className="flex-1 flex-row bg-primary">
      <View className="w-64 bg-black-100 p-4 border-r border-gray-700 hidden md:flex flex-col">
        <Text className="text-white text-3xl font-pbold mb-10 text-center">ECG Flow</Text>
        <CustomWebNavLink href="/home" icon={icons.home} title="Início" />
        {user?.role === 'enfermeiro' && (
          <CustomWebNavLink href="/enfermeiro/create" icon={icons.plus} title="Upload ECG" />
        )}
        {user?.role === 'medico' && (
          <CustomWebNavLink href="/medico/laudo" icon={icons.bookmark} title="Laudos" />
        )}
        <CustomWebNavLink href="/profile" icon={icons.profile} title="Meu Perfil" />
      </View>
      <View className="flex-1">
        <View className="h-16 bg-black-100 items-center justify-center border-b border-gray-700 flex md:hidden">
          <Text className="text-white text-lg font-psemibold">ECG Flow</Text>
        </View>
        {children}
      </View>
    </View>
  );
};

// --- Componente Principal do Layout (TabsLayout) ---
export default function TabsLayout() {
  const { user, isLoading } = useGlobalContext();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <Text className="text-white text-lg">Carregando permissões...</Text>
      </View>
    );
  }

  // Defina o nome e ícone da aba dinâmica conforme o usuário
  let dinamicaTitle = '';
  let dinamicaIcon = null;
  if (user?.role === 'enfermeiro') {
    dinamicaTitle = 'Upload';
    dinamicaIcon = icons.plus;
  } else if (user?.role === 'medico') {
    dinamicaTitle = 'Laudo';
    dinamicaIcon = icons.bookmark;
  }

  // WEB
  if (Platform.OS === 'web') {
    return (
      <WebNavigationLayout>
        <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="home" />
          <Tabs.Screen name="dinamica" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </WebNavigationLayout>
    );
  }

  // MOBILE - 3 abas, sendo a do meio dinâmica
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFA001",
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarStyle: {
          backgroundColor: "#161622",
          borderTopWidth: 2,
          borderTopColor: "#232533",
          height: 105,
           // AUMENTADO A ALTURA AQUI PARA 105 PIXELS
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.home}
              color={color}
              name="Início"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dinamica"
        options={{
          title: dinamicaTitle,
          headerShown: false,
          tabBarIcon: ({ color, focused }) =>
            dinamicaIcon ? (
              <TabIcon
                icon={dinamicaIcon}
                color={color}
                name={dinamicaTitle}
                focused={focused}
              />
            ) : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.profile}
              color={color}
              name="Perfil"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
