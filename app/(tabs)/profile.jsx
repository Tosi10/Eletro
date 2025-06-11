import { Text, View, FlatList, Image, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images } from '../../constants';
import EmptyState from '../../components/EmptyState';
import { getUserPosts, signOut } from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import InfoBox from '../../components/InfoBox';
import { router } from 'expo-router';
// import LoadingSpinner from '../../components/LoadingSpinner'; // Comentei, pois você não tem, mas pode adicionar

// Importar o novo componente EcgCard
import EcgCard from '../../components/EcgCard';

const Profile = () => {
  const { user, setUser, setIsLogged, isLoading: isGlobalLoading } = useGlobalContext();

  // A função getUserPosts deve estar retornando os ECGs com o objeto 'creator' populado
  const { data: ecgs, isLoading: areEcgsLoading, refetch } = useAppwrite(
    () => user?.$id ? getUserPosts(user.$id) : Promise.resolve([]),
    [user?.$id]
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // console.log("User no Profile:", user);
    // console.log("Is Global Loading:", isGlobalLoading);
    // if (user) {
    //   console.log("Username do usuário:", user.username);
    //   console.log("Avatar do usuário:", user.avatar);
    // }
  }, [user, isGlobalLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.replace('/sign-in');
  };

  // Mostrar carregamento enquanto o usuário ou os ECGs estão sendo carregados
  if (isGlobalLoading || !user || areEcgsLoading) {
    return (
      <SafeAreaView className="bg-primary h-full justify-center items-center">
        {/* {isLoading && <LoadingSpinner />} */}
        <Text className="text-white text-lg mt-4">Carregando perfil e histórico de ECGs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={ecgs} // Agora passamos os ECGs
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <EcgCard ecg={item} /> // Renderiza o EcgCard para cada item
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
              <InfoBox
                title={ecgs.length || 0} // Mostra a quantidade de ECGs
                subtitle="ECGs Enviados"
                containerStyles="mr-10"
                titleStyles="text-xl"
              />

              <InfoBox
                title="0" // Este é um valor fixo, pode ajustar ou remover
                subtitle="Recebidos" // Pode mudar para algo como "Laudos Recebidos" ou remover
                titleStyles="text-xl"
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="Nenhum ECG encontrado"
            subtitle="Você ainda não enviou nenhum eletrocardiograma."
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default Profile;