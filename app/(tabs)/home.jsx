import { StyleSheet, Text, View, FlatList, Image, RefreshControl, Alert } from 'react-native';
import React, { use, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../constants';
import SearchInput from '../../components/SearchInput';
import Trending from '../../components/Trending';
import EmptyState from '../../components/EmptyState';
import { useState } from 'react';
import { getAllPosts , getLatestPosts} from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';
import VideoCard from '../../components/VideoCard';
import { useGlobalContext } from '../../context/GlobalProvider';

const Home = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(getAllPosts);
  const { data: latestPosts } = useAppwrite(getLatestPosts);

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // Simula uma chamada de API ou operação assíncrona
    await refetch();
    setRefreshing(false)
  }
 
  return (
  <SafeAreaView className="bg-blue-900 border-2 h-full">
    <View className="my-6 px-4 space-y-6 flex-1">
      <View className="justify-between items-start flex-row mb-6">
        <View>
          <Text className="font-pmedium text-sm text-gray-100">
            Welcome Back
          </Text>
          <Text className="text-2xl font-psemibold text-white">
            {user?.username}
          </Text>
        </View>
        {/*<View className="mt-1.5">
          <Image
            source={images.logoSmall}
            resizeMode="contain"
            className="w-9 h-10"
          />
        </View>*/}
      </View>

      {/*<SearchInput />*/}

      <View className="w-full  pt-7 pb-8">
        <Text className="text-gray-100 text-lg font-pregular mb-3">
          Videos Recentes
        </Text>
        <Trending posts={latestPosts ?? []}/>
      </View>

      {/* Aqui você pode colocar seus textos personalizados */}
      <View className="mt-8">
        <Text className="text-white text-lg font-psemibold mb-2">
          Bem-vindo à sua área de vídeos!
        </Text>
        <Text className="text-gray-100 text-base">
          Aqui você encontra os vídeos em destaque na seção acima.
        </Text>
        <Text className="text-gray-100 text-base mt-2">
          Em breve, mais novidades e conteúdos exclusivos para você.
        </Text>
      </View>
    </View>
  </SafeAreaView>
);
};

export default Home;