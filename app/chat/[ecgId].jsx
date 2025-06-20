import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
// MUDANÇA AQUI: Importa as funções do novo lib/firebase.js
import { getEcgMessages, sendEcgMessage, subscribeToEcgMessages, getEcgById } from '../../lib/firebase'; 
import { useGlobalContext } from '../../context/GlobalProvider';
import { icons, images } from '../../constants';

const ChatScreen = () => {
  const { ecgId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useGlobalContext();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [ecgDetails, setEcgDetails] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!ecgId || !user || !user.uid) { // Verifica user.uid
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home'); 
      }
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const ecgDoc = await getEcgById(ecgId);
        setEcgDetails(ecgDoc);

        const initialMessages = await getEcgMessages(ecgId);
        setMessages(initialMessages);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar o chat ou detalhes do ECG.');
        console.error('Erro ao carregar chat ou ECG details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Configurar listener em tempo real para novas mensagens
    // subscribeToEcgMessages já adiciona a nova mensagem e popula o sender
    const unsubscribe = subscribeToEcgMessages(ecgId, (newMsg) => {
      setMessages(prevMessages => {
        // Verifica se a mensagem já existe (pelo ID do Firestore) para evitar duplicatas
        if (prevMessages.some(msg => msg.id === newMsg.id)) { // MUDANÇA AQUI: usa msg.id
          return prevMessages;
        }
        // Adiciona a nova mensagem e reordena por data de criação (createdAt no Firebase)
        // Note: createdAt do Firebase é um Timestamp, precisamos compará-lo.
        return [...prevMessages, newMsg].sort((a, b) => {
          const dateA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.$createdAt).getTime();
          const dateB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.$createdAt).getTime();
          return dateA - dateB;
        });
      });
    });

    return () => {
      unsubscribe();
    };
  }, [ecgId, user]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !user.uid || !ecgId) return; // Verifica user.uid

    try {
      await sendEcgMessage(ecgId, user.uid, newMessage); // MUDANÇA AQUI: Usa user.uid
      setNewMessage(''); 
    } catch (error) {
      Alert.alert('Erro ao Enviar', 'Não foi possível enviar a mensagem.');
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === user.uid; // MUDANÇA AQUI: Usa user.uid
    const senderName = item.sender?.username || 'Usuário Desconhecido';
    const senderAvatar = item.sender?.avatar || images.profile; 

    // Formata o timestamp do Firebase (se existir)
    const messageTime = item.createdAt && item.createdAt.toDate ? 
                        new Date(item.createdAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
                        (item.$createdAt ? new Date(item.$createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');


    return (
      <View
        className={`flex-row mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
      >
        {!isMyMessage && ( 
          <Image
            source={{ uri: senderAvatar }}
            className="w-8 h-8 rounded-full mr-2"
            resizeMode="cover"
          />
        )}
        <View
          className={`px-4 py-2 rounded-lg max-w-[70%] ${
            isMyMessage ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          {!isMyMessage && <Text className="text-white font-psemibold text-xs mb-1">{senderName}</Text>}
          <Text className="text-white">{item.message}</Text>
          <Text className={`text-xs mt-1 ${isMyMessage ? 'text-blue-200' : 'text-gray-400'} self-end`}>
            {messageTime}
          </Text>
        </View>
        {isMyMessage && ( 
          <Image
            source={{ uri: senderAvatar }} 
            className="w-8 h-8 rounded-full ml-2"
            resizeMode="cover"
          />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="bg-primary h-full justify-center items-center">
        <ActivityIndicator size="large" color="#FFA001" />
        <Text className="text-white mt-4">Carregando mensagens...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} 
      >
        {/* Cabeçalho do Chat */}
        <View className="bg-black-100 p-4 flex-row items-center justify-between border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Image source={icons.leftArrow} className="w-6 h-6" tintColor="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-psemibold flex-1 text-center">
            Chat ECG: <Text>{ecgDetails?.patientName || 'Carregando...'}</Text>
          </Text>
          <View className="w-6 h-6" /> 
        </View>

        {/* Lista de Mensagens */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id} // MUDANÇA AQUI: Usa item.id
          renderItem={renderMessage}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, flexGrow: 1 }}
          className="flex-1"
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-400 text-lg">Nenhuma mensagem ainda. Seja o primeiro a conversar!</Text>
            </View>
          )}
        />

        {/* Input de Mensagem */}
        <View className="flex-row items-center p-4 bg-black-100 border-t border-gray-700">
          <TextInput
            className="flex-1 h-12 bg-gray-800 text-white rounded-lg px-4 mr-2"
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#CDCDE0"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline={true}
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            className="bg-blue-600 p-3 rounded-lg"
            disabled={!newMessage.trim()}
          >
            <Image source={icons.send} className="w-6 h-6" tintColor="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
