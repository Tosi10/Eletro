import { Text, View, Image, Platform, TouchableOpacity } from 'react-native';
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { icons } from '../../constants'; // Importa os ícones do seu arquivo constants
import { useGlobalContext } from '../../context/GlobalProvider'; // Importar useGlobalContext

// --- Componente de Ícone da Aba (TabIcon) ---
// Usado para as abas inferiores no mobile (iOS/Android)
const TabIcon = ({ icon, color, name, focused }) => {
  return (
    // Mantendo pt-6 e pt-8 para o deslocamento vertical desejado dos ícones
    // e w-full para ocupar a largura total do slot da aba.
    <View className={`flex-col items-center w-full gap-1 ${focused ? 'pt-6' : 'pt-8'}`}> 
      <Image 
        source={icon}
        resizeMode="contain"
        tintColor={color} 
        className="w-7 h-7" // Mantém o tamanho original dos ícones
      />
      {/* CORREÇÃO AQUI: Garante que não há caracteres invisíveis entre <Text> e {name} */}
      <Text 
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`} 
        style={{ color: color }}
        numberOfLines={1} // Garante que o texto não quebre para a próxima linha
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
  const { user } = useGlobalContext(); // Acessa o usuário logado e seu role

  return (
    <View className="flex-1 flex-row bg-primary"> {/* Container principal para layout web */}
      {/* Sidebar de Navegação */}
      <View className="w-64 bg-black-100 p-4 border-r border-gray-700 hidden md:flex flex-col"> 
        <Text className="text-white text-3xl font-pbold mb-10 text-center">ECG Flow</Text> {/* Título do App */}
        {/* Links de navegação para as telas principais */}
        <CustomWebNavLink href="/home" icon={icons.home} title="Início" />
        
        {/* Link para Upload ECG - APENAS PARA ENFERMEIROS */}
        {user?.role === 'enfermeiro' && (
          <CustomWebNavLink href="/enfermeiro/create" icon={icons.plus} title="Upload ECG" />
        )}

        {/* Link para Laudo - APENAS PARA MÉDICOS */}
        {user?.role === 'medico' && (
          <CustomWebNavLink href="/medico/laudo" icon={icons.bookmark} title="Laudos" />
        )}
        
        <CustomWebNavLink href="/profile" icon={icons.profile} title="Meu Perfil" />
        {/* Você pode adicionar um botão de logout aqui para web, se desejar */}
      </View>

      {/* Conteúdo Principal (Onde as telas serão renderizadas) */}
      <View className="flex-1">
        {/* Uma Top Bar para telas menores na web, caso a sidebar esteja oculta */}
        <View className="h-16 bg-black-100 items-center justify-center border-b border-gray-700 flex md:hidden"> 
            <Text className="text-white text-lg font-psemibold">ECG Flow</Text>
        </View>
        {children} {/* As telas filhas do Tabs (Home, Create, Profile, Laudo) serão renderizadas aqui */}
      </View>
    </View>
  );
};

// --- Componente Principal do Layout (TabsLayout) ---
// Este componente decide qual layout de navegação renderizar
export default function TabsLayout() {
  const { user, isLoading } = useGlobalContext(); // Acessa o usuário e o estado de carregamento

  // Mostra um estado de carregamento enquanto o user é carregado no GlobalProvider
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <Text className="text-white text-lg">Carregando permissões...</Text>
      </View>
    );
  }

  console.log('TabsLayout: user?.role é:', user?.role);

  // Lógica de renderização condicional baseada na plataforma
  if (Platform.OS === 'web') {
    return (
      <WebNavigationLayout>
        <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="home" />
          
          {/* Aba/Rota para Upload ECG - APENAS PARA ENFERMEIROS */}
          {user?.role === 'enfermeiro' && (
            <Tabs.Screen name="dinamica" /> // Redireciona para /enfermeiro/create
          )}

          {/* Aba/Rota para Laudo - APENAS PARA MÉDICOS */}
          {user?.role === 'medico' && (
            <Tabs.Screen name="dinamica" /> // Redireciona para /medico/laudo
          )}
          
          <Tabs.Screen name="profile" />
        </Tabs>
      </WebNavigationLayout>
    );
  }

  // --- REVISÃO DA LÓGICA DE RENDERING CONDICIONAL PARA MOBILE ---
  // Vamos construir a lista de abas dinamicamente para evitar slots vazios
  const mobileTabs = [];

  mobileTabs.push(
    <Tabs.Screen
      key="home" // Adicione key para melhor performance em listas
      name="home"
      options={{
        title:'Home',
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
  );

  // Adiciona a aba 'dinamica' para lidar com redirecionamento de role
  mobileTabs.push(
    <Tabs.Screen
      key="dinamica"
      name="dinamica"
      options={{
        // Título e ícone dependem do role do usuário
        title: user?.role === 'enfermeiro' ? 'Upload' : (user?.role === 'medico' ? 'Laudos' : 'Carregando'),
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon
            icon={user?.role === 'enfermeiro' ? icons.plus : (user?.role === 'medico' ? icons.document : icons.bookmark)} 
            color={color}
            name={user?.role === 'enfermeiro' ? 'Upload' : (user?.role === 'medico' ? 'Laudos' : 'Carregando')} 
            focused={focused}
          />
        ),
      }}
    />
  );

  mobileTabs.push(
    <Tabs.Screen
      key="profile" // Adicione key
      name="profile"
      options={{
        title:'Profile',
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
  );

  return (
    <Tabs 
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFA001",
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarStyle: {
          backgroundColor: "#161622",
          borderTopWidth: 4,
          borderTopColor: "#232533",
          height: 90, // Altura da TABBAR
        },
      }}
    >
      {mobileTabs} {/* Renderiza as abas construídas dinamicamente */}
    </Tabs>
  );
};
