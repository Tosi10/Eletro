import React from 'react';
import { View, Text, Image } from 'react-native'; // Não precisamos do StyleSheet para Tailwind
import { images } from '../constants'; // Para fallback de avatar, se necessário

// Função simples para formatar a data (pode ser movida para utils/helpers.js mais tarde)
const formatEcgDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
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

  // Desestruturando o objeto ecg para facilitar o acesso
  const { patientName, examDate, imageUrl, status, uploaderId, notes, creator } = ecg;

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

      {/* Informações do ECG */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-psemibold text-lg">{patientName}</Text>
        <Text className="text-gray-100 font-pregular text-sm">{formatEcgDate(examDate)}</Text>
      </View>

      <Text className="text-gray-100 font-pregular text-base mb-2">
        Status: <Text className={`${status === 'pending' ? 'text-yellow-400' : 'text-green-400'} font-psemibold`}>
          {status === 'pending' ? 'Pendente' : 'Laudado'}
        </Text>
      </Text>

      {/* Informações do Uploader (Enfermeira) */}
      {creator && ( // Verifica se o objeto creator existe
        <View className="flex-row items-center mb-2">
          <Image
            source={{ uri: creator.avatar || images.profile }} // Fallback para avatar
            className="w-8 h-8 rounded-full mr-2"
            resizeMode="cover"
          />
          <Text className="text-gray-100 font-pregular text-sm">
            Enviado por: {creator.username}
          </Text>
        </View>
      )}

      {/* Notas/Observações */}
      {notes && ( // Renderiza apenas se houver notas
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
                Laudado por: {ecg.laudationId} {/* Você precisaria buscar o nome do médico aqui, por enquanto o ID */}
              </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default EcgCard;