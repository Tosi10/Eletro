import { StyleSheet, Text, View, FlatList, Image, RefreshControl, Alert, Touchable } from 'react-native';
import React, { use, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images } from '../../constants';
import Trending from '../../components/Trending';
import EmptyState from '../../components/EmptyState';
import { getUserPosts, signOut } from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';
import VideoCard from '../../components/VideoCard';
import { useLocalSearchParams } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { TouchableOpacity } from 'react-native';
import InfoBox from '../../components/InfoBox';
import { router } from 'expo-router';

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts } = useAppwrite(() => getUserPosts(user.$id));
  const [refreshing, setRefreshing] = useState(false);

  const logout = async () => { 
    await signOut();
    setUser(null);
    setIsLogged(false);

    router.replace('/sign-in')
  }
console.log("Avatar URL:", user?.avatar);
  return (
    <SafeAreaView className="bg-primary border-2 h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard 
            video={item.video}
            thumbnail={item.thumbnail}
            creator={item.creator.username}
            avatar={item.creator.avatar}
            originalItem={item}
          />
        )}
        ListHeaderComponent={() => (
          <View className="w-full justify-center items-center mt-6 mb-12 px-4">
            <TouchableOpacity
            className="w-full items-end mb-10"
            onPress={logout}
            >
              <Image source={icons.logout} 
              resizeMode='contain' className="w-6 h-6"/>
            </TouchableOpacity>

            <View className="w-16 h-16 border border-secondary rounded-lg justify-center items-center">
              
              <Image source={{uri: user?.avatar }}
              className="w-[90%] h-[90%] rounded-lg"
              resizeMode='cover'/>

            </View>

            <InfoBox
              title={user?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
              
            />

            <View className="mt-5 flex-row">
              <InfoBox
              title={posts.length || 0}
              subtitle="Posts"
              containerStyles="mr-10"
              titleStyles="text-xl"
              
            />

              <InfoBox
              title="1.2K"
              subtitle="Followers"
              titleStyles="text-xl"
              
            />

            </View>


          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No videos found"
            subtitle="No videos found for this profile."
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Profile;