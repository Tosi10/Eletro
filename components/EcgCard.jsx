import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons } from '../constants'; // Assumindo que icons está aqui
import { router } from 'expo-router'; // Para navegação
import { useGlobalContext } from '../context/GlobalProvider';

const EcgCard = ({ ecg }) => {
  const { user } = useGlobalContext(); // Para verificar o usuário logado

  // Conversão do Firestore Timestamp para Date legível
  const createdAtDate = ecg.createdAt && ecg.createdAt.toDate ? ecg.createdAt.toDate() : new Date();
  const formattedDate = createdAtDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = createdAtDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'lauded':
        return 'Laudado';
      default:
        return 'Desconhecido';
    }
  };

  const handleChatPress = () => {
    if (ecg.id) {
      router.push(`/chat/${ecg.id}`);
    } else {
      Alert.alert('Erro', 'ID do ECG não disponível para abrir o chat.');
    }
  };

  // Determinar qual avatar mostrar (criador ou laudador)
  const displayAvatar = ecg.status === 'lauded' && ecg.laudationDoctor 
                        ? ecg.laudationDoctor.avatar 
                        : (ecg.creator ? ecg.creator.avatar : 'https://ui-avatars.com/api/?name=U'); // Fallback para "U" se não houver criador

  const displayName = ecg.status === 'lauded' && ecg.laudationDoctor
                      ? ecg.laudationDoctor.username
                      : (ecg.creator ? ecg.creator.username : 'Desconhecido');


  return (
    <View className="flex-col items-center px-4 mb-14">
      <View className="flex-row gap-3 items-start">
        <View className="justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center p-0.5">
            <Image
              source={{ uri: displayAvatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>

          <View className="flex-1 justify-center ml-3 gap-y-1">
            <Text
              className="font-psemibold text-sm text-white"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              className="font-pregular text-xs text-gray-100"
              numberOfLines={1}
            >
              {ecg.patientName} - ID: {ecg.id?.substring(0, 8) || 'N/A'}
            </Text>
          </View>

          <View className="pt-2">
            <Image
              source={icons.menu}
              className="w-5 h-5"
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <View className="w-full h-60 rounded-xl mt-3 relative justify-center items-center">
        <Image
          source={{ uri: ecg.imageUrl }}
          className="w-full h-full rounded-xl"
          resizeMode="cover"
        />
      </View>

      <View className="flex-row justify-between items-center w-full mt-3">
        <Text className="text-gray-100 text-sm font-pregular">
          Idade: {ecg.age}
        </Text>
        <Text className="text-gray-100 text-sm font-pregular">
          Sexo: {ecg.sex}
        </Text>
        <Text className="text-gray-100 text-sm font-pregular">
          Marcapasso: {ecg.hasPacemaker}
        </Text>
      </View>
      <View className="flex-row justify-between items-center w-full mt-2">
        <Text className="text-gray-100 text-sm font-pregular">
          Status: <Text className={`font-psemibold ${ecg.status === 'pending' ? 'text-yellow-400' : 'text-green-500'}`}>{displayStatus(ecg.status)}</Text>
        </Text>
        <Text className="text-gray-100 text-sm font-pregular">
          Prioridade: <Text className={`font-psemibold ${ecg.priority === 'Urgente' ? 'text-red-500' : 'text-orange-400'}`}>{ecg.priority}</Text>
        </Text>
      </View>
      <Text className="text-gray-100 text-sm font-pregular w-full mt-2">
        Enviado em: {formattedDate} às {formattedTime}
      </Text>
      {ecg.notes && (
        <Text className="text-gray-100 text-sm font-pregular w-full mt-2" numberOfLines={2}>
          Observações: {ecg.notes}
        </Text>
      )}

      {ecg.status === 'lauded' && ecg.laudationContent && (
        <View className="w-full mt-4 p-3 bg-gray-800 rounded-lg">
          <Text className="text-white text-base font-psemibold mb-2">Laudo Final:</Text>
          <Text className="text-gray-200 text-sm" numberOfLines={3}>
            {ecg.laudationContent}
          </Text>
          {ecg.laudationDoctor && (
            <Text className="text-gray-400 text-xs mt-2">
              Laudado por: {ecg.laudationDoctor.username} em {ecg.laudedAt?.toDate ? ecg.laudedAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
            </Text>
          )}
        </View>
      )}

      {/* Botão Abrir Chat */}
      <TouchableOpacity
        onPress={handleChatPress}
        activeOpacity={0.7}
        className="w-full bg-blue-600 rounded-full min-h-[50px] justify-center items-center mt-5"
      >
        <Text className="text-white font-psemibold text-base">Abrir Chat</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EcgCard;
