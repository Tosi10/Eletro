import React from 'react';
import { View, Text, Image } from 'react-native';
import { images } from '../constants'; // Para fallback de avatar, se necessário

// Função para formatar a data
const formatDisplayDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Retorna a data no formato 'DD de Mês de AAAA HH:MM'
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error("Erro ao formatar data do ECG:", error);
    return dateString; // Retorna a string original em caso de erro
  }
};

const EcgCard = ({ ecg }) => {
  if (!ecg) {
    return null;
  }

  // Desestruturando as propriedades do objeto ecg
  const { 
    patientName, 
    age, 
    sex, 
    notes, 
    imageUrl, 
    status, 
    creator, 
    $createdAt, // Appwrite automaticamente adiciona esta propriedade
    hasPacemaker, // Campo de Marcapasso
    priority      // Campo de Prioridade
  } = ecg;

  // Usa $createdAt como a data a ser exibida
  const dateToDisplay = $createdAt;

  return (
    <View className="bg-black-100 rounded-xl mb-4 p-4 border-2 border-black-200">
      {/* Imagem do ECG */}
      <View className="w-full h-48 rounded-lg overflow-hidden mb-4">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover" 
        />
      </View>

      {/* Informações do ECG (Paciente, Data) */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-psemibold text-lg">{patientName}</Text>
        <Text className="text-gray-100 font-pregular text-sm">{formatDisplayDate(dateToDisplay)}</Text>
      </View>

      {/* Informações de Idade e Sexo */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-100 font-pregular text-base">
          Idade: <Text className="text-white font-psemibold">{age || 'N/A'}</Text>
        </Text>
        <Text className="text-gray-100 font-pregular text-base">
          Sexo: <Text className="text-white font-psemibold">{sex || 'N/A'}</Text>
        </Text>
      </View>

      {/* Informações de Marcapasso e Prioridade */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-100 font-pregular text-base">
          Marcapasso: <Text className="text-white font-psemibold">{hasPacemaker || 'N/A'}</Text>
        </Text>
        <Text className="text-gray-100 font-pregular text-base">
          Prioridade: <Text className={`font-psemibold ${
            priority === 'Urgente' ? 'text-red-400' : 
            priority === 'Eletivo' ? 'text-orange-400' : 'text-white'
          }`}>
            {priority || 'N/A'}
          </Text>
        </Text>
      </View>

      <Text className="text-gray-100 font-pregular text-base mb-2">
        Status: <Text className={`${status === 'pending' ? 'text-yellow-400' : 'text-green-400'} font-psemibold`}>
          {status === 'pending' ? 'Pendente' : 'Laudado'}
        </Text>
      </Text>

      {/* Informações do Uploader (Enfermeira) */}
      {creator && ( 
        <View className="flex-row items-center mb-2">
          <Image
            source={{ uri: creator.avatar || images.profile }} 
            className="w-8 h-8 rounded-full mr-2"
            resizeMode="cover"
          />
          <Text className="text-gray-100 font-pregular text-sm">
            Enviado por: <Text className="text-white font-pmedium">{creator.username}</Text> {/* ENVOLVIDO EM TEXT */}
          </Text>
        </View>
      )}

      {/* Notas/Observações */}
      {notes && ( 
        <View className="mt-2">
          <Text className="text-gray-100 font-pmedium text-sm">
            Observações:
          </Text>
          <Text className="text-gray-100 font-pregular text-sm">
            {notes}
          </Text>
        </View>
      )}

      {/* Placeholder para Laudo (futuramente) */}
      {ecg.status === 'lauded' && ecg.laudationContent && (
        <View className="mt-4 p-3 bg-blue-900/20 rounded-lg">
          <Text className="text-blue-300 font-psemibold text-sm">Laudo:</Text>
          <Text className="text-blue-200 font-pregular text-sm">{ecg.laudationContent}</Text>
          {ecg.laudationId && (
              <Text className="text-blue-400 font-pregular text-xs mt-1">
                Laudado por: <Text className="text-white font-pmedium">{ecg.laudationId}</Text> {/* ENVOLVIDO EM TEXT */}
              </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default EcgCard;
