import { StyleSheet, Text, View, FlatList, Image, RefreshControl, Alert, ImageBackground } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../constants';
import SearchInput from '../../components/SearchInput';
import Trending from '../../components/Trending';
import EmptyState from '../../components/EmptyState';
import { getAllPosts, getLatestPosts } from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';

import { useGlobalContext } from '../../context/GlobalProvider';

const Home = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(getAllPosts);
  const { data: latestPosts } = useAppwrite(getLatestPosts);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    // ImageBackground AGORA FORA da SafeAreaView e cobrindo toda a tela
    <ImageBackground
      source={images.cardio2}
      resizeMode="cover"
      // Estilo para cobrir 100% da largura e altura da tela
      style={StyleSheet.absoluteFillObject} // Isso fará com que a imagem preencha a tela inteira
    >
      {/* Overlay para suavizar a imagem de fundo */}
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 1,
        }}
      />

      {/* SafeAreaView agora envolve apenas o conteúdo que precisa de áreas seguras */}
      <SafeAreaView className="h-full flex-1" style={{ zIndex: 2, backgroundColor: 'transparent' }}>
        <FlatList // Usando FlatList para permitir rolagem e RefreshControl
          data={posts} // Se quiser exibir os posts, use 'posts' aqui
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <View>
              {/* Conteúdo do item da lista. Todos os textos devem estar em <Text>. */}
              <Text className="text-white">ECG: {item.patientName}</Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <View className="my-6 px-4 space-y-6">
              <View className="justify-between items-start flex-row mb-6">
                <View>
                  <Text className="font-pmedium text-sm text-gray-100">
                    Welcome Back
                  </Text>
                  <Text className="text-2xl font-psemibold text-white">
                    {user?.username}
                  </Text>
                </View>
              </View>

              {/* Removido comentário de SearchInput para evitar possível conflito */}
              {/* <SearchInput /> */}

              <View className="w-full pt-7 pb-8">
                <Text className="text-gray-100 text-2xl font-pregular mb-3">
                  ECG'S
                </Text>
                {/* Removido comentário inline do Trending para evitar possível conflito 
                <Trending posts={latestPosts ?? []} /> */}
              </View>

              <View className="mt-8">
                <Text className="text-white text-xl font-psemibold mb-2">
                  Bem-vindo !
                </Text>
                <Text className="text-gray-100 text-lg">
                  Ecgs Flow é uma plataforma dedicada a conectar enfermeiros e médicos, facilitando o upload e análise de exames de ECG.
                </Text>
                <Text className="text-gray-100 text-base mt-2">
                  Em breve, mais novidades e conteúdos exclusivos.
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <EmptyState
              title="Nenhum ECG Encontrado"
              subtitle="Nenhum ECG ainda, seja o primeiro a fazer o upload!"
            />
          )} 
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff" // Cor do spinner de refresh
            />
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Home;
