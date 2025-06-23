import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, ImageBackground, Image } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants';
import CustomButton from '../components/CustomButton';
import { useGlobalContext } from '../context/GlobalProvider';

export default function App() {
  const { isLoading, isLogged } = useGlobalContext();

  if (!isLoading && isLogged) return <Redirect href="/home" />;

  return (
    <SafeAreaView className="h-full flex-1">
      <ImageBackground
        source={images.cardio2}
        resizeMode="cover"
        style={{ flex: 1, width: '100%', height: '100%' }}
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

        <ScrollView contentContainerStyle={{ flexGrow: 1, zIndex: 2 }}>
          <View className="w-full items-center justify-center min-h-[84vh] px-4">
            {/* Remova a imagem do topo, pois agora é o background */}

            <View className="relative mt-5">
              <Text className="text-5xl text-white font-bold text-center">
                V6 Core{' '}
                {/*<Text className="text-secondary-200">M2</Text>*/}
              </Text>

              {/*<Image
                source={images.path}
                className="w-[120px] h-[15px] absolute -bottom-3 -right-12"
                resizeMode="contain"
              />*/}
            </View>

            <Text className="text-md font-pregular text-gray-100 mt-7 text-center">
              Eletrocardiogramas.
            </Text>

            <CustomButton
              title="Continue with E-mail"
              handlePress={() => router.push('/sign-in')}
              containerStyles="w-full mt-7"
            />
          </View>
        </ScrollView>

        <StatusBar backgroundColor="#161622" style="light" />
      </ImageBackground>
    </SafeAreaView>
  );
}