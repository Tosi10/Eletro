import { StyleSheet, Text, View, FlatList, Image, RefreshControl, Alert } from 'react-native';
import React, { use, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../constants';
import SearchInput from '../../components/SearchInput';
import Trending from '../../components/Trending';
import EmptyState from '../../components/EmptyState';
import { useState } from 'react';


import VideoCard from '../../components/VideoCard';
import { useLocalSearchParams } from 'expo-router';

const Search = () => {
  const { query } = useLocalSearchParams();
  const { data: posts, refetch } = useAppwrite( () => searchPosts(query));
  

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    refetch();
  }, [query]);
 
  return (
    <SafeAreaView className="bg-primary border-2 h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard video={item}/>
        )}
        ListHeaderComponent={() => (
          <View className="my-6 px-4">
            
              
                <Text className="font-pmedium text-sm text-gray-100">
                 Search Results
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  {query}
                </Text>

                <View className="mt-6 mb-8">
                  < SearchInput initialQuery={query}/>
                </View>  
             

          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No videos found"
            subtitle="No videos found for this search query."
          />
        )}

        
      />
    </SafeAreaView>
  );
};

export default Search