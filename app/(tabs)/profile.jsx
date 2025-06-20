import { Text, View, FlatList, Image, RefreshControl, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images } from '../../constants';
import EmptyState from '../../components/EmptyState';
import { getUserPosts, signOut, getPendingEcgs, getLaudedEcgsByDoctorId } from '../../lib/firebase'; 
import useFirebaseData from '../../lib/useFirebaseData'; 
import { useGlobalContext } from '../../context/GlobalProvider';
import InfoBox from '../../components/InfoBox';
import { router } from 'expo-router';

import EcgCard from '../../components/EcgCard';

const Profile = () => {
  const { user, setUser, setIsLogged, isLoading: isGlobalLoading } = useGlobalContext();

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
    // REMOVIDO: console.log('DEBUG DO AVATAR (dentro do useEffect): user.avatar é:', user?.avatar);
    fetchPendingForDoctor(); 
  }, [user, fetchPendingForDoctor]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch(); 
    await fetchPendingForDoctor(); 
    setRefreshing(false);
  };

  const logout = async () => {
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

  const laudedEcgsCount = ecgs.filter(ecg => ecg.status === 'lauded').length;

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

            <View className="w-24 h-24 border border-secondary rounded-full justify-center items-center p-1">
              <Image
                source={images.profile} // SEMPRE USA A IMAGEM LOCAL
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
