import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React, { use } from 'react';
import { icons } from '../constants'; // Corrigido o caminho para o arquivo de ícones
import { useState } from 'react';
import { WebView } from 'react-native-webview';

const VideoCard = ({ video }) => {
  console.log("VideoCard - Video data:", video); // Adicionando log para verificar os dados

  // Verifica se o objeto video e suas propriedades existem
  const { title, thumbnail, video: videoUrl, creator } = video || {};
  const { username, avatar } = creator || {};
  const [play, setPlay] = useState(false);  

  return (
    <View className="flex-col items-center px-4 mb-14">
      <View className="flex-row gap-3 items-start">
        <View className="justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center p-0.5">
            <Image source={{ uri: avatar }} className="w-full h-full rounded-lg" resizeMode="cover" />
          </View>

          <View className="justify-center flex-1 ml-3 gap-y-1">   
            <Text className="text-white font-psemibold text-sm" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-xs text-gray-100 font-pregular" numberOfLines={1}>
              {username}
            </Text>
          </View>
        </View>

        <View className="pt-2">
          <Image source={icons.menu} className="w-5 h-5" resizeMode="contain" />
        </View>
      </View>

      {play ? (
        <WebView
        source={{ uri:videoUrl }} // URL do Vimeo
        style={{ width: 380, height: 280, borderRadius: 30, backgroundColor:'black', borderWidth: 20 }}
        allowsFullscreenVideo
      />
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
          className="w-full h-60 rounded-xl mt-3 relative justify-center items-center"
        >
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VideoCard;

