import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View , ScrollView, Image} from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import  { images } from '../constants';
import CustomButton from '../components/CustomButton';
import { useGlobalContext } from '../context/GlobalProvider';



export default function App() {
  const {isLoading, isLogged} = useGlobalContext();

  if(!isLoading && isLogged) return <Redirect href="/home" />

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className="w-full items-center justify-center  min-h-[84vh] px-4">
          <Image 
            source={images.logo}
            className="w-[130px] h-[84px]"
            resizeMode='contain'
          />

          <Image
            source={images.cards}
            className="max-w-[380px] w-full h-[300px]"
            resizeMode='contain'
          />

          <View className="relative mt-5">
            <Text className="text-3xl text-white font-bold text-center">Discover all the shit in our awesome {' '}
            <Text className="text-secondary-200">Aora</Text>
            </Text>

            <Image
              source={images.path}
              className="w-[136px] h-[15px] absolute -bottom-3 -right-0"
              resizeMode='contain'
            />
            
          </View>

          <Text className="text-sm font-pregular text-gray-100 mt-7 text-center"> Where creativity meets inovation:
          embark on a journey of  limitless exploration with Aora.
          </Text>

          <CustomButton
            title="Continue with E-mail"
            handlePress={() => router.push('/sign-in')}
            containerStyles="w-full mt-7"
          />
          
        </View>
      </ScrollView>

      <StatusBar backgroundColor='#161622' style='light'/>
    </SafeAreaView>
  );
}
