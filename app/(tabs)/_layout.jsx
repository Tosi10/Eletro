import { Text, View, Image, Platform, TouchableOpacity } from 'react-native';
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { icons } from '../../constants'; // Importa os ícones do seu arquivo constants

// --- Componente de Ícone da Aba (TabIcon) ---
// Usado para as abas inferiores no mobile (iOS/Android)
const TabIcon = ({ icon, color, name, focused }) => {
  return (
    // Mantendo pt-6 e pt-8 para o deslocamento vertical desejado dos ícones
    // e w-full para ocupar a largura total do slot da aba.
    // O problema do texto cortado será resolvido com o aumento da altura da tabBar.
    <View className={`items-center w-full ${focused ? 'pt-6' : 'pt-8'}`}> 
      <Image 
        source={icon}
        resizeMode="contain"
        tintColor={color} 
        className="w-7 h-7" // Mantém o tamanho original dos ícones
      />
      {/* Corrigida a interpolação de string do className para Tailwind */}
      <Text 
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs mt-1`} // Adicionado mt-1 (margin-top: 4px) para espaçamento entre ícone e texto
        style={{ color: color, textAlign: 'left', width: 45}}
        numberOfLines={1}
        ellipsizeMode="tail"
      >  
        {name}
      </Text>
    </View>
  );
};

// --- Componente para Link de Navegação Web (CustomWebNavLink) ---
// Usado na Sidebar para o layout web
const CustomWebNavLink = ({ href, icon, title }) => {
  const router = useRouter(); 
  const isActive = router.pathname === href; // Verifica se a rota atual corresponde ao link

  return (
    <TouchableOpacity 
      onPress={() => router.push(href)} 
      className={`flex-row items-center p-3 rounded-lg mb-2 transition-colors ${
        isActive ? 'bg-blue-600' : 'hover:bg-gray-700' // Destaca o link ativo na web
      }`}
    >
      {icon && <Image source={icon} resizeMode="contain" className="w-5 h-5 mr-3" tintColor={isActive ? '#FFFFFF' : '#CDCDE0'} />}
      <Text className={`text-base font-pmedium ${isActive ? 'text-white' : 'text-gray-200'}`}>{title}</Text>
    </TouchableOpacity>
  );
};

// --- Componente de Layout de Navegação Web (WebNavigationLayout) ---
// Este será o container principal para a visualização web, incluindo a sidebar/topbar
const WebNavigationLayout = ({ children }) => {
  return (
    <View className="flex-1 flex-row bg-primary"> {/* Container principal para layout web */}
      {/* Sidebar de Navegação */}
      {/* hidden md:flex flex-col: Esconde a sidebar em telas pequenas e mostra como flex column em telas médias/grandes */}
      <View className="w-64 bg-black-100 p-4 border-r border-gray-700 hidden md:flex flex-col"> 
        <Text className="text-white text-3xl font-pbold mb-10 text-center">ECG Flow</Text> {/* Título do App */}
        {/* Links de navegação para as telas principais */}
        <CustomWebNavLink href="/home" icon={icons.home} title="Início" />
        <CustomWebNavLink href="/create" icon={icons.plus} title="Upload ECG" /> {/* Usando icons.plus */}
        {/* Removido o link para o Calendário/Agenda */}
        <CustomWebNavLink href="/profile" icon={icons.profile} title="Meu Perfil" />
        {/* Você pode adicionar um botão de logout aqui para web, se desejar */}
      </View>

      {/* Conteúdo Principal (Onde as telas de Home, Create, Profile serão renderizadas) */}
      <View className="flex-1">
        {/* Uma Top Bar para telas menores na web, caso a sidebar esteja oculta */}
        <View className="h-16 bg-black-100 items-center justify-center border-b border-gray-700 flex md:hidden"> {/* Visível em telas pequenas */}
            <Text className="text-white text-lg font-psemibold">ECG Flow</Text>
        </View>
        {children} {/* As telas filhas do Tabs (Home, Create, Profile) serão renderizadas aqui */}
      </View>
    </View>
  );
};

// --- Componente Principal do Layout (TabsLayout) ---
// Este componente decide qual layout de navegação renderizar
export default function TabsLayout() {
  // Lógica de renderização condicional baseada na plataforma
  if (Platform.OS === 'web') {
    return (
      <WebNavigationLayout>
        {/*
          No layout web, o Tabs component ainda é usado para gerenciar as rotas filhas,
          mas ele não renderiza sua própria barra de abas.
          A barra de abas é substituída pela WebNavigationLayout.
          screenOptions={{ headerShown: false }} é importante para que as telas internas não mostrem um header duplicado.
          tabBarStyle: { display: 'none' } esconde a barra de abas padrão do Tabs.
        */}
        <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="home" />
          <Tabs.Screen name="create" />
          {/* REMOVIDO: Tabs.Screen para o calendário */}
          <Tabs.Screen name="profile" />
        </Tabs>
      </WebNavigationLayout>
    );
  }

  // Layout para Mobile (abas inferiores) - o código existente
  return (
    <Tabs 
      screenOptions={{
        tabBarShowLabel: false, // Não mostra o texto abaixo do ícone
        tabBarActiveTintColor: "#FFA001", // Cor do ícone ativo
        tabBarInactiveTintColor: "#CDCDE0", // Cor do ícone inativo
        tabBarStyle: {
          backgroundColor: "#161622", // Cor de fundo da barra de abas
          borderTopWidth: 4, // Borda superior
          borderTopColor: "#232533", // Cor da borda
          height: 90, // AUMENTADO A ALTURA DA TABBAR para dar mais espaço ao texto (era 83)
        },
      }}
    >  
      <Tabs.Screen
        name="home"
        options={{
          title:'Home', // Título para fins internos ou debug
          headerShown: false, // Não mostra o cabeçalho da tela
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.home}
              color={color}
              name="Início" // Nome exibido abaixo do ícone no mobile
              focused={focused}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="create"
        options={{
          title:'Create',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.plus} // Usando icons.plus para o upload
              color={color}
              name="Upload"
              focused={focused}
            />
          ),
        }}
      />
      
      {/* REMOVIDO: Tabs.Screen para o calendário */}
      
      <Tabs.Screen
        name="profile"
        options={{
          title:'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.profile}
              color={color}
              name="Perfil" // Nome exibido abaixo do ícone no mobile
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
};
