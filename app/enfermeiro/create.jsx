import { Alert, Image, ScrollView, Text, TouchableOpacity, View, ImageBackground, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
// Caminhos de importação ajustados para o nível correto
import FormField from '../../components/FormField'; 
import CustomButton from '../../components/CustomButton'; 
import { icons, images } from '../../constants'; 
// MUDANÇA AQUI: Importa do Firebase
import { createEcg } from '../../lib/firebase'; 
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; 
import * as Linking from 'expo-linking';

const Create = () => {
  const { user } = useGlobalContext();
  const router = useRouter();

  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    patientName: '',
    age: '',
    sex: '',
    hasPacemaker: '', 
    priority: '',     
    ecgFile: null,
    notes: '',
  });

  const openPicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos de acesso à sua galeria para que você possa selecionar imagens. Por favor, conceda a permissão nas configurações do aplicativo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
        ]
      );
      return; 
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 1, 
      aspect: [4, 3], 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm((prev) => ({
        ...prev,
        ecgFile: result.assets[0], 
      }));
    } else {
      if (!result.canceled) { 
        Alert.alert('Atenção', 'Nenhuma imagem selecionada.');
      }
    }
  };

  const submit = async () => {
    if (!user || !user.uid) { // Verifica user.uid do Firebase
      return Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
    }
    if (
      !form.patientName ||
      !form.age ||
      !form.sex ||
      !form.hasPacemaker || 
      !form.priority ||     
      !form.ecgFile ||
      !form.notes
    ) {
      return Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos e selecione a imagem do ECG.');
    }

    setUploading(true); 

    try {
      await createEcg({
        patientName: form.patientName,
        age: form.age,
        sex: form.sex,
        hasPacemaker: form.hasPacemaker,
        priority: form.priority,
        ecgFile: form.ecgFile,
        notes: form.notes,
        uploaderId: user.uid, // MUDANÇA AQUI: Usa user.uid para o Firebase
      });

      Alert.alert('Sucesso', 'ECG enviado para laudo com sucesso!');
      router.replace('/home'); // Redireciona para a home, onde as abas estarão visíveis novamente
      setForm({
        patientName: '',
        age: '',
        sex: '',
        hasPacemaker: '',
        priority: '',
        ecgFile: null,
        notes: '',
      });
    } catch (error) {
      Alert.alert('Erro no Upload', error.message);
      console.error('Erro detalhado no upload do ECG:', error);
    } finally {
      setUploading(false); 
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full flex-1">
      <ImageBackground
        source={images.cardio2} 
        resizeMode="cover"
        className="flex-1 w-full h-full"
      >
        <View 
          pointerEvents="none" 
          className="absolute inset-0 bg-black/20 z-10"
        />

        <ScrollView className="px-4 my-6" contentContainerStyle={{ flexGrow: 1, zIndex: 2 }}>
          {/* Botão de Voltar para a Home */}
          <TouchableOpacity onPress={() => router.replace('/home')} className="flex-row items-center mb-6">
            <Image source={icons.leftArrow} className="w-6 h-6 mr-2" resizeMode="contain" tintColor="#FFFFFF" />
            <Text className="text-white text-base font-pmedium">Voltar para Home</Text>
          </TouchableOpacity>

          <Text className="text-2xl text-white font-psemibold">
            Upload de Eletrocardiograma
          </Text>

          <FormField
            title="Nome do Paciente"
            value={form.patientName}
            placeholder="Digite o nome completo do paciente..."
            handleChangeText={(e) => setForm({ ...form, patientName: e })}
            otherStyles="mt-10"
          />

          <FormField
            title="Idade"
            value={form.age}
            placeholder="Digite a idade do paciente..."
            keyboardType="numeric" 
            handleChangeText={(e) => setForm({ ...form, age: e })}
            otherStyles="mt-7"
          />

          <View className="mt-7">
            <Text className="text-base text-gray-100 font-pmedium mb-2">Sexo</Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => setForm({ ...form, sex: 'Masculino' })}
                className={`py-2 px-5 rounded-lg ${form.sex === 'Masculino' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
              >
                <Text className="text-white font-pmedium">Masculino</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setForm({ ...form, sex: 'Feminino' })}
                className={`py-2 px-5 rounded-lg ${form.sex === 'Feminino' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
              >
                <Text className="text-white font-pmedium">Feminino</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-7">
              <Text className="text-base text-gray-100 font-pmedium mb-2">Possui Marcapasso?</Text>
              <View className="flex-row space-x-4">
                  <TouchableOpacity
                      onPress={() => setForm({ ...form, hasPacemaker: 'Sim' })}
                      className={`py-2 px-5 rounded-lg ${form.hasPacemaker === 'Sim' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
                  >
                      <Text className="text-white font-pmedium">Sim</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      onPress={() => setForm({ ...form, hasPacemaker: 'Não' })}
                      className={`py-2 px-5 rounded-lg ${form.hasPacemaker === 'Não' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
                  >
                      <Text className="text-white font-pmedium">Não</Text>
                  </TouchableOpacity>
              </View>
          </View>

          <View className="mt-7">
              <Text className="text-base text-gray-100 font-pmedium mb-2">Prioridade</Text>
              <View className="flex-row space-x-4">
                  <TouchableOpacity
                      onPress={() => setForm({ ...form, priority: 'Urgente' })}
                      className={`py-2 px-5 rounded-lg ${form.priority === 'Urgente' ? 'bg-red-600' : 'bg-gray-800 border border-gray-700'}`}
                  >
                      <Text className="text-white font-pmedium">Urgente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      onPress={() => setForm({ ...form, priority: 'Eletivo' })} 
                      className={`py-2 px-5 rounded-lg ${form.priority === 'Eletivo' ? 'bg-orange-500' : 'bg-gray-800 border border-gray-700'}`}
                  >
                      <Text className="text-white font-pmedium">Eletivo</Text> 
                  </TouchableOpacity>
              </View>
          </View>

          <View className="mt-7 space-y-2">
            <Text className="text-base text-gray-100 font-pmedium">
              Imagem do Eletrocardiograma
            </Text>

            <TouchableOpacity onPress={openPicker}>
              {form.ecgFile ? (
                <Image
                  source={{ uri: form.ecgFile.uri }}
                  className="w-full h-64 rounded-2xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-16 px-4 bg-black-100 rounded-2xl justify-center items-center border-2 border-black-200 flex-row space-x-2">
                  <Image source={icons.upload} resizeMode='contain' className="w-5 h-5" />
                  <Text className="text-sm text-gray-100 font-pmedium">
                    Escolher imagem
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <FormField
            title="Observações Adicionais"
            value={form.notes}
            placeholder="Descreva quaisquer observações importantes sobre o exame..."
            handleChangeText={(e) => setForm({ ...form, notes: e })}
            otherStyles="mt-7"
          />

          <CustomButton
            title="Enviar ECG para Laudo"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={uploading}
          />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Create;
