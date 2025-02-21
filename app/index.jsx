import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-red-300">
      <Text className="text-4xl font-pblack">Tosi mestre!</Text>
      <StatusBar style="auto" />
      <Link href="/profile" >Go to Profile</Link>

    </View>
  );
}

