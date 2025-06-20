import { Text, View, FlatList, Image, RefreshControl, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images } from '../../constants';
import EmptyState from '../../components/EmptyState';
// MUDANÇA AQUI: Importa do Firebase
import { getUserPosts, signOut, getPendingEcgs, getLaudedEcgsByDoctorId } from '../../lib/firebase'; 
// MUDANÇA AQUI: Usa o novo hook renomeado
import useFirebaseData from '../../lib/useFirebaseData'; 
import { useGlobalContext } from '../../context/GlobalProvider';
import InfoBox from '../../components/InfoBox';
import { router } from 'expo-router';

import EcgCard from '../../components/EcgCard';

const Profile = () => {
  const { user, setUser, setIsLogged, isLoading: isGlobalLoading } = useGlobalContext();

  // Condicionalmente, buscamos os ECGs com base no role do usuário
  let fetchFunction;
  let fetchDependencies = [user?.uid]; // Dependência padrão para ambos (user.uid do Firebase)

  if (user?.role === 'enfermeiro') {
    fetchFunction = () => user?.uid ? getUserPosts(user.uid) : Promise.resolve([]);
  } else if (user?.role === 'medico') {
    fetchFunction = () => user?.uid ? getLaudedEcgsByDoctorId(user.uid) : Promise.resolve([]);
  } else {
    fetchFunction = () => Promise.resolve([]);
  }

  const { data: ecgs, isLoading: areEcgsLoading, refetch } = useFirebaseData(
    fetchFunction,
    fetchDependencies
  );

  const [pendingEcgsCount, setPendingEcgsCount] = useState(0);
  const [fetchingPending, setFetchingPending] = useState(false);

  useEffect(() => {
    // DEBUG DO AVATAR: user.avatar é: (agora no useEffect, não no JSX)
    console.log('DEBUG DO AVATAR (dentro do useEffect): user.avatar é:', user?.avatar);

    const fetchPendingForDoctor = async () => {
      if (user?.role === 'medico' && user?.uid) { // Verifica user.uid antes de buscar
        setFetchingPending(true);
        try {
          const allPendingEcgs = await getPendingEcgs(); // Busca todos os pendentes, sem filtro de prioridade
          setPendingEcgsCount(allPendingEcgs.length);
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
    await refetch(); 
    if (user?.role === 'medico' && user?.uid) {
      const allPendingEcgs = await getPendingEcgs();
      setPendingEcgsCount(allPendingEcgs.length);
    }
    setRefreshing(false);
  };

  const logout = async () => {
    await signOut(); // Usa a função signOut do Firebase
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
        keyExtractor={(item) => item.id} // MUDANÇA AQUI: Usa 'item.id' do Firestore
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
              {/* console.log removido daqui para evitar o erro de texto */}
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
              ) : ( 
                <>
                  <InfoBox
                    title={ecgs.length || 0} 
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
