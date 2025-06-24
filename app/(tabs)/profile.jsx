import { Text, View, FlatList, Image, RefreshControl, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images } from '../../constants';
import EmptyState from '../../components/EmptyState';
// Importa 'db' (embora não seja mais usado diretamente aqui para contagem global)
import { getUserPosts, signOut, getPendingEcgs, getLaudedEcgsByDoctorId, db } from '../../lib/firebase'; 
import useFirebaseData from '../../lib/useFirebaseData'; 
import { useGlobalContext } from '../../context/GlobalProvider';
import InfoBox from '../../components/InfoBox';
import { router } from 'expo-router';

import EcgCard from '../../components/EcgCard';

// Removida importação de 'collection', 'query', 'where', 'onSnapshot', 'orderBy'
// pois a lógica de contagem global foi movida para EcgCard.

const Profile = () => {
  const { user, setUser, setIsLogged, isLoading: isGlobalLoading } = useGlobalContext();
  // Removidos estados de contagem global de mensagens não lidas
  // const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  // const [loadingUnread, setLoadingUnread] = useState(true);
  // const unreadListenersAndCounts = useRef({}); 

  const fetchEcgsFunction = useCallback(() => {
    if (!user?.uid) { 
      console.log('Profile: user.uid não disponível para buscar ECGs.');
      return Promise.resolve([]);
    }
    
    if (user?.role === 'enfermeiro') {
      console.log('Profile: Buscando ECGs enviados pelo enfermeiro:', user.uid);
      return getUserPosts(user.uid);
    } else if (user?.role === 'medico') {
      console.log('Profile: Buscando ECGs laudados pelo médico:', user.uid);
      return getLaudedEcgsByDoctorId(user.uid);
    }
    console.warn('Profile: Papel do usuário não reconhecido, retornando ECGs vazios.');
    return Promise.resolve([]);
  }, [user?.uid, user?.role]);

  const { data: ecgs, isLoading: areEcgsLoading, refetch } = useFirebaseData(
    fetchEcgsFunction,
    [user?.uid, user?.role] 
  );

  const [pendingEcgsCount, setPendingEcgsCount] = useState(0);
  const [fetchingPending, setFetchingPending] = useState(false);

  const fetchPendingForDoctor = useCallback(async () => {
    if (user?.role === 'medico' && user?.uid) {
      setFetchingPending(true);
      try {
        console.log('Profile: Buscando ECGs pendentes para o médico...');
        const allPendingEcgs = await getPendingEcgs();
        setPendingEcgsCount(allPendingEcgs.length);
        console.log('Profile: ECGs pendentes encontrados:', allPendingEcgs.length);
      } catch (error) {
        console.error("Erro ao buscar ECGs pendentes para o médico:", error);
        setPendingEcgsCount(0);
      } finally {
        setFetchingPending(false);
      }
    } else {
      setPendingEcgsCount(0);
    }
  }, [user?.role, user?.uid]);

  useEffect(() => {
    fetchPendingForDoctor(); 
  }, [user, fetchPendingForDoctor]);

  // Removido o useEffect para a contagem global de mensagens não lidas
  /*
  useEffect(() => {
    // ... (toda a lógica de contagem global de mensagens foi removida daqui)
  }, [user, ecgs, areEcgsLoading, db]);
  */

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch(); 
    await fetchPendingForDoctor(); 
    setRefreshing(false);
  };

  const handleLogout = async () => { 
    try {
      await signOut(); 
      setUser(null);
      setIsLogged(false);
      router.replace('/sign-in');
    } catch (error) {
      Alert.alert('Erro ao Sair', error.message);
      console.error('Erro durante o logout:', error);
    }
  };

  const laudedsOrSentEcgsCount = ecgs.length || 0;

  if (isGlobalLoading || !user || areEcgsLoading || (user?.role === 'medico' && fetchingPending)) {
    return (
      <SafeAreaView className="bg-primary h-full justify-center items-center">
        <ActivityIndicator size="large" color="#FFA001" />
        <Text className="text-white text-lg mt-4">Carregando perfil e histórico de ECGs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={ecgs}
        keyExtractor={(item) => item.id} 
        renderItem={({ item }) => (
          // PASSANDO currentUserId PARA O EcgCard
          <EcgCard ecg={item} currentUserId={user?.uid} /> 
        )}
        ListHeaderComponent={() => (
          <View className="w-full justify-center items-center mt-6 mb-12 px-4">
            <TouchableOpacity
              className="w-full items-end mb-10"
              onPress={handleLogout} 
            >
              <Image source={icons.logout}
                resizeMode='contain' className="w-6 h-6" />
            </TouchableOpacity>

            <View className="w-24 h-24 border border-secondary rounded-full justify-center items-center p-1">
              <Image
                source={images.profile} 
                className="w-full h-full rounded-full" 
                resizeMode='cover' 
              />
            </View>

            <InfoBox
              title={user.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="mt-5 flex-row">
              {user?.role === 'enfermeiro' ? (
                <>
                  <InfoBox
                    title={laudedsOrSentEcgsCount}
                    subtitle="ECGs Enviados"
                    containerStyles="mr-10"
                    titleStyles="text-xl"
                  />
                  <InfoBox
                    title={ecgs.filter(ecg => ecg.status === 'lauded').length}
                    subtitle="Laudos Recebidos"
                    titleStyles="text-xl"
                  />
                </>
              ) : ( 
                <>
                  <InfoBox
                    title={laudedsOrSentEcgsCount} 
                    subtitle="ECGs Laudados"
                    containerStyles="mr-10"
                    titleStyles="text-xl"
                  />
                  <InfoBox
                    title={pendingEcgsCount} 
                    subtitle="ECGs Pendentes"
                    titleStyles="text-xl"
                  />
                </>
              )}
            </View>

            {/* REMOVIDO: Botão Abrir Chat global com Contador de Mensagens Não Lidas */}
            {/*
            <TouchableOpacity
              onPress={() => router.push('/chat-inbox')} 
              className="flex-row items-center justify-center bg-secondary-100 rounded-xl min-h-[60px] w-full px-4 mt-7"
            >
              <Text className="text-lg text-white font-psemibold">Abrir Chat</Text>
              {loadingUnread ? (
                <ActivityIndicator size="small" color="#FFFFFF" className="ml-2" />
              ) : unreadMessageCount > 0 ? (
                <View className="ml-3 bg-red-500 rounded-full w-7 h-7 flex items-center justify-center">
                  <Text className="text-white text-sm font-pbold">{unreadMessageCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            */}

          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title={`Nenhum ECG ${user?.role === 'medico' ? 'Laudado' : 'Enviado'} `}
            subtitle={user?.role === 'medico' ? 
                      "Você ainda não laudou nenhum eletrocardiograma." : 
                      "Você ainda não enviou nenhum eletrocardiograma."}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      />
    </SafeAreaView>
  );
};

export default Profile;
