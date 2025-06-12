// app/(tabs)/laudo.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Laudo = () => {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-primary">
      <Text className="text-white text-2xl font-pbold">Tela de Laudos</Text>
      <Text className="text-gray-100 mt-2">Esta área é apenas para Médicos.</Text>
    </SafeAreaView>
  );
};

export default Laudo;