import { Text, View, FlatList, Image, RefreshControl, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'; // <--- GARANTIDO QUE ActivityIndicator ESTÁ AQUI
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images } from '../../constants';
import EmptyState from '../../components/EmptyState';
// Importa ambas as funções de busca de ECGs
import { getUserPosts, signOut, getPendingEcgs, getLaudedEcgsByDoctorId } from '../../lib/appwrite'; 
import useAppwrite from '../../lib/useAppwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import InfoBox from '../../components/InfoBox';
import { router } from 'expo-router';

import EcgCard from '../../components/EcgCard';

const Profile = () => {
  const { user, setUser, setIsLogged, isLoading: isGlobalLoading } = useGlobalContext();

  // Condicionalmente, buscamos os ECGs com base no role do usuário
  let fetchFunction;
  let fetchDependencies = [user?.$id]; // Dependência padrão para ambos

  if (user?.role === 'enfermeiro') {
    fetchFunction = () => user?.$id ? getUserPosts(user.$id) : Promise.resolve([]);
  } else if (user?.role === 'medico') {
    fetchFunction = () => user?.$id ? getLaudedEcgsByDoctorId(user.$id) : Promise.resolve([]);
  } else {
    // Se o role não for reconhecido, não busca nada
    fetchFunction = () => Promise.resolve([]);
  }

  const { data: ecgs, isLoading: areEcgsLoading, refetch } = useAppwrite(
    fetchFunction,
    fetchDependencies
  );

  // NOVO ESTADO: Para armazenar ECGs pendentes (apenas para médicos)
  const [pendingEcgsCount, setPendingEcgsCount] = useState(0);
  const [fetchingPending, setFetchingPending] = useState(false);

  useEffect(() => {
    const fetchPendingForDoctor = async () => {
      if (user?.role === 'medico') {
        setFetchingPending(true);
        try {
          // Buscamos os ECGs urgentes e eletivos separadamente para contagem
          const urgentEcgs = await getPendingEcgs('Urgente');
          const electiveEcgs = await getPendingEcgs('Eletivo');
          setPendingEcgsCount(urgentEcgs.length + electiveEcgs.length);
        } catch (error) {
          console.error("Erro ao buscar ECGs pendentes para o médico:", error);
          setPendingEcgsCount(0);
        } finally {
          setFetchingPending(false);
        }
      }
    };
    fetchPendingForDoctor();
  }, [user]);


  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch(); // Refetch dos ECGs do perfil
    if (user?.role === 'medico') {
      const urgentEcgs = await getPendingEcgs('Urgente');
      const electiveEcgs = await getPendingEcgs('Eletivo');
      setPendingEcgsCount(urgentEcgs.length + electiveEcgs.length);
    }
    setRefreshing(false);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.replace('/sign-in');
  };

  // Calcular a contagem de ECGs laudados pelo enfermeiro
  const laudedEcgsCount = ecgs.filter(ecg => ecg.status === 'lauded').length;

  // Mostrar carregamento enquanto o usuário ou os ECGs estão sendo carregados
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
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <EcgCard ecg={item} />
        )}
        ListHeaderComponent={() => (
          <View className="w-full justify-center items-center mt-6 mb-12 px-4">
            <TouchableOpacity
              className="w-full items-end mb-10"
              onPress={logout}
            >
              <Image source={icons.logout}
                resizeMode='contain' className="w-6 h-6" />
            </TouchableOpacity>

            <View className="w-16 h-16 border border-secondary rounded-lg justify-center items-center">
              <Image
                source={{ uri: user.avatar }}
                className="w-[90%] h-[90%] rounded-lg"
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
                    title={ecgs.length || 0}
                    subtitle="ECGs Enviados"
                    containerStyles="mr-10"
                    titleStyles="text-xl"
                  />
                  <InfoBox
                    title={laudedEcgsCount}
                    subtitle="Laudos Recebidos"
                    titleStyles="text-xl"
                  />
                </>
              ) : ( // Se for médico
                <>
                  <InfoBox
                    title={ecgs.length || 0} // ecgs para médico são os LAUDADOS
                    subtitle="ECGs Laudados"
                    containerStyles="mr-10"
                    titleStyles="text-xl"
                  />
                  <InfoBox
                    title={pendingEcgsCount} // Mostra a contagem de pendentes
                    subtitle="ECGs Pendentes"
                    titleStyles="text-xl"
                  />
                </>
              )}
            </View>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default Profile;
