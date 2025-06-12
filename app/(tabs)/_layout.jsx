import { Text, View, Image, Platform, TouchableOpacity } from 'react-native';
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { icons } from '../../constants'; // Importa os ícones do seu arquivo constants
import { useGlobalContext } from '../../context/GlobalProvider'; // Importar useGlobalContext

// --- Componente de Ícone da Aba (TabIcon) ---
// Usado para as abas inferiores no mobile (iOS/Android)
const TabIcon = ({ icon, color, name, focused }) => {
  return (
    // Revertendo para a estrutura que você tinha originalmente para o TabIcon
    // 'items-center justify-center': Centraliza o conteúdo (ícone e texto) dentro do espaço da aba.
    // O gap-1 no Text abaixo é para espaçamento entre o ícone e o nome.
    <View className="items-center justify-center"> 
      <Image 
        source={icon}
        resizeMode="contain"
        tintColor={color} 
        className="w-7 h-7" // Mantém o tamanho original dos ícones (28x28px)
        style={{ marginTop: focused ? 12 : 23 }} // RESTAURADO: Seu marginTop condicional para o alinhamento do ícone
      />
      {/* Usando mt-1 para um pequeno espaçamento entre ícone e texto */}
      <Text 
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs mt-1`} 
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
          <CustomWebNavLink href="/create" icon={icons.plus} title="Upload ECG" />
        )}

        {/* Link para Laudo - APENAS PARA MÉDICOS */}
        {user?.role === 'medico' && (
          <CustomWebNavLink href="/laudo" icon={icons.bookmark} title="Laudos" />
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

  // Lógica de renderização condicional baseada na plataforma
  if (Platform.OS === 'web') {
    return (
      <WebNavigationLayout>
        <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="home" />
          
          {/* Aba/Rota para Upload ECG - APENAS PARA ENFERMEIROS */}
          {user?.role === 'enfermeiro' && (
            <Tabs.Screen name="create" />
          )}

          {/* Aba/Rota para Laudo - APENAS PARA MÉDICOS */}
          {user?.role === 'medico' && (
            <Tabs.Screen name="laudo" /> 
          )}
          
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
          height: 83, // RESTAURADO: Altura original da TABBAR
        },
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
              name="Início"
              focused={focused}
            />
          ),
        }}
      />
      
      {/* Aba para Upload - APENAS PARA ENFERMEIROS (usando tabBarButton para esconder completamente) */}
      <Tabs.Screen
        name="create"
        options={{
          title:'Create',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.plus}
              color={color}
              name="Upload"
              focused={focused}
            />
          ),
          // Esconde o botão da aba se o usuário não for enfermeiro
          tabBarButton: (props) => {
            if (user?.role === 'enfermeiro') {
              return <TouchableOpacity {...props} />;
            }
            return null; // Não renderiza o botão se o role não for 'enfermeiro'
          },
        }}
      />

      {/* Aba para Laudo - APENAS PARA MÉDICOS (usando tabBarButton para esconder completamente) */}
      <Tabs.Screen
        name="laudo" 
        options={{
          title: 'Laudo',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.plus} // Usando icons.document, ajuste se tiver outro ícone para laudo
              color={color}
              name="Laudo"
              focused={focused}
            />
          ),
          // Esconde o botão da aba se o usuário não for médico
          tabBarButton: (props) => {
            if (user?.role === 'medico') {
              return <TouchableOpacity {...props} />;
            }
            return null; // Não renderiza o botão se o role não for 'medico'
          },
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
              name="Perfil"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
};
