import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { images, icons } from '../constants'; // Para a imagem de perfil e ícone de chat
import { useRouter } from 'expo-router';

// Função para formatar o Timestamp do Firebase para data e hora local
// Esta função é compatível com o tipo Timestamp do Firebase Firestore
const formatFirebaseTimestamp = (timestamp) => {
  // Verifica se o timestamp existe e se possui o método toDate() (indicando um Timestamp do Firebase)
  if (!timestamp || typeof timestamp.toDate !== 'function') return 'N/A';
  const date = timestamp.toDate(); // Converte o Timestamp do Firebase para objeto Date
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formattedDate} às ${formattedTime}`;
};

const EcgCard = ({ ecg }) => {
  const router = useRouter();

  if (!ecg) {
    return null;
  }

  // Desestruturando as propriedades do objeto ecg
  // Agora, esperando a estrutura de dados vinda do Firebase/Firestore
  const { 
    patientName, 
    age, 
    sex, 
    notes, 
    imageUrl, 
    status, 
    creator, // Objeto 'creator' para o uploader (enfermeiro)
    createdAt, // <<< MUDANÇA: 'createdAt' é o nome do campo para Timestamps no Firebase
    hasPacemaker, 
    priority,      
    laudationContent, 
    laudationDoctor // Objeto 'laudationDoctor' para o médico laudador
  } = ecg;

  // O ID do ECG para navegação para o chat será 'ecg.id' no Firebase/Firestore
  const ecgIdForChat = ecg.id; // <<< MUDANÇA: Usa 'id' (do Firebase Doc ID) em vez de '$id' (do Appwrite)

  // Função para abrir a tela de chat para este ECG
  const handleOpenChat = () => {
    if (ecgIdForChat) {
      router.push(`/chat/${ecgIdForChat}`); // Navega para a tela de chat com o ID do ECG
    } else {
      // Alerta se o ID do ECG não estiver disponível para o chat
      // (Isso deve ser raro se o ECG foi carregado corretamente)
      Alert.alert('Erro', 'ID do ECG não disponível para abrir o chat.');
    }
  };

  // Lógica para determinar qual nome exibir no cabeçalho do cartão
  let displayCreatorName = creator?.username || 'Enfermeiro(a) Desconhecido';
  if (status === 'lauded' && laudationDoctor?.username) {
    // Se o ECG foi laudado, mostra o nome do médico laudador
    displayCreatorName = laudationDoctor.username;
  }

  return (
    <View className="bg-black-100 rounded-xl mb-4 p-4 border-2 border-black-200">
      {/* Seção do Cabeçalho: Avatar e Nome do Criador/Laudador */}
      <View className="flex-row gap-3 items-start mb-4">
        {/* Container do Avatar */}
        <View className="w-10 h-10 rounded-full border border-secondary justify-center items-center p-0.5">
          {/* IMAGEM DO AVATAR: AGORA SEMPRE USA A IMAGEM DE PERFIL LOCAL */}
          <Image
            source={images.profile} // <<< MUDANÇA: Usa diretamente o asset local 'images.profile'
            className="w-full h-full rounded-full"
            resizeMode="cover"
            // Não precisamos mais de onError ou lógica de fallback complexa aqui
          />
        </View>

        {/* Informações do Nome e Paciente/ID */}
        <View className="flex-1 justify-center">
          <Text className="text-white font-psemibold text-sm" numberOfLines={1}>
            {displayCreatorName}
          </Text>
          <Text className="text-gray-100 font-pregular text-xs" numberOfLines={1}>
            Paciente: {patientName} - ID: {ecg.id?.substring(0, 8) || 'N/A'} {/* Usa ecg.id */}
          </Text>
        </View>
      </View>

      {/* Imagem do ECG */}
      <View className="w-full h-48 rounded-lg overflow-hidden mb-4">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Detalhes do ECG (Idade, Sexo, Marcapasso, Prioridade, Status, Data de Envio) */}
      <View className="mb-2">
        <Text className="text-gray-100 font-pregular text-base">
          Idade: <Text className="text-white font-psemibold">{age || 'N/A'}</Text>
        </Text>
        <Text className="text-gray-100 font-pregular text-base">
          Sexo: <Text className="text-white font-psemibold">{sex || 'N/A'}</Text>
        </Text>
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
        <Text className="text-gray-100 font-pregular text-base">
          Status: <Text className={`${status === 'pending' ? 'text-yellow-400' : 'text-green-400'} font-psemibold`}>
            {status === 'pending' ? 'Pendente' : 'Laudado'}
          </Text>
        </Text>
        {createdAt && ( // Exibe a data de criação se disponível
          <Text className="text-gray-100 font-pregular text-sm mt-1">
            Enviado em: {formatFirebaseTimestamp(createdAt)}
          </Text>
        )}
      </View>

      {/* Seção de Notas/Observações Adicionais */}
      {notes && ( // Renderiza este bloco apenas se houver notas
        <View className="mt-2">
          <Text className="text-gray-100 font-pmedium text-base">
            Observações:
          </Text>
          <Text className="text-gray-100 font-pregular text-base">
            {notes}
          </Text>
        </View>
      )}

      {/* Seção do Laudo (se o status for 'lauded' e houver conteúdo de laudo) */}
      {status === 'lauded' && laudationContent && (
        <View className="mt-4 p-3 bg-blue-900/20 rounded-lg">
          <Text className="text-blue-300 font-psemibold text-base">Laudo:</Text>
          <Text className="text-blue-200 font-pregular text-base">{laudationContent}</Text>
          {laudationDoctor && ( // Exibe o nome do médico que laudou se disponível
              <Text className="text-blue-400 font-pregular text-sm mt-1">
                Laudado por: <Text className="text-white font-pmedium">{laudationDoctor.username}</Text>
              </Text>
          )}
        </View>
      )}

      {/* Botão para Abrir Chat */}
      <TouchableOpacity
        onPress={handleOpenChat}
        className="mt-4 bg-secondary-100 p-3 rounded-lg flex-row items-center justify-center"
      >
        <Image source={icons.chat} className="w-5 h-5 mr-2" tintColor="#FFF" />
        <Text className="text-white font-pmedium text-base">Abrir Chat</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EcgCard;
