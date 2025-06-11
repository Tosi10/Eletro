import { Alert, Image, ScrollView, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { icons, images } from '../../constants'; // Certifique-se de importar 'images'
import CustomButton from '../../components/CustomButton';
import { createEcg } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // Usar ImagePicker com 'I' maiúsculo
import * as Linking from 'expo-linking'; // Importar para abrir configurações de permissão

const Create = () => {
  const { user } = useGlobalContext();
  const router = useRouter();

  const [uploading, setUploading] = useState(false);

  // Removido o estado showDatePicker e examDate do formulário
  const [form, setForm] = useState({
    patientName: '',
    age: '',
    sex: '',
    hasPacemaker: '', // Novo campo: 'Sim' ou 'Não'
    priority: '',     // Novo campo: 'Urgente' ou 'Eminente'
    ecgFile: null,
    notes: '',
  });

  // Removidas as funções onChangeDate e showDatepicker

  const openPicker = async () => {
    // Solicita permissão da biblioteca de mídia
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    // Se a permissão não for concedida, alerta e oferece para abrir as configurações
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos de acesso à sua galeria para que você possa selecionar imagens. Por favor, conceda a permissão nas configurações do aplicativo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
        ]
      );
      return; // Interrompe a função se a permissão não for concedida
    }

    // Lança a biblioteca de imagens
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Permite selecionar qualquer tipo de imagem
      quality: 1, // Qualidade da imagem (1 é a melhor)
      aspect: [4, 3], // Proporção da imagem (opcional, pode ser ajustado)
    });

    // Processa o resultado da seleção
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm((prev) => ({
        ...prev,
        ecgFile: result.assets[0], // Pega o primeiro asset selecionado
      }));
    } else {
      // Se o usuário cancelou a seleção (result.canceled é true) ou não selecionou nada
      if (!result.canceled) { // Apenas mostra se não foi um cancelamento explícito
        Alert.alert('Atenção', 'Nenhuma imagem selecionada.');
      }
    }
  };

  const submit = async () => {
    // Validação de usuário logado
    if (!user) {
      return Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
    }
    // Validação de todos os campos obrigatórios do formulário
    if (
      !form.patientName ||
      !form.age ||
      !form.sex ||
      !form.hasPacemaker || // Validação para 'Possui Marcapasso'
      !form.priority ||     // Validação para 'Prioridade'
      !form.ecgFile ||
      !form.notes
    ) {
      return Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos e selecione a imagem do ECG.');
    }

    setUploading(true); // Inicia o estado de upload

    try {
      // Chama a função createEcg do Appwrite com todos os dados do formulário
      await createEcg({
        patientName: form.patientName,
        // Removido examDate daqui, não será mais enviado
        age: form.age,
        sex: form.sex,
        hasPacemaker: form.hasPacemaker,
        priority: form.priority,
        ecgFile: form.ecgFile,
        notes: form.notes,
        uploaderId: user.$id, // ID da enfermeira que está enviando
      });

      Alert.alert('Sucesso', 'ECG enviado para laudo com sucesso!');
      router.push('/home'); // Redireciona para a tela inicial (ou outra tela de sucesso)
      // Reseta o formulário após o sucesso
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
      setUploading(false); // Finaliza o estado de upload
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full flex-1">
      <ImageBackground
        source={images.cardio2} // ou a imagem que preferir
        resizeMode="cover"
        className="flex-1 w-full h-full"
      >
        {/* Overlay para escurecer a imagem e melhorar a leitura */}
        <View 
          pointerEvents="none" 
          className="absolute inset-0 bg-black/20 z-10"
        />

        <ScrollView className="px-4 my-6" contentContainerStyle={{ flexGrow: 1, zIndex: 2 }}>
          <Text className="text-2xl text-white font-psemibold">
            Upload de Eletrocardiograma
          </Text>

          {/* Campo Nome do Paciente */}
          <FormField
            title="Nome do Paciente"
            value={form.patientName}
            placeholder="Digite o nome completo do paciente..."
            handleChangeText={(e) => setForm({ ...form, patientName: e })}
            otherStyles="mt-10"
          />

          {/* Campo Idade */}
          <FormField
            title="Idade"
            value={form.age}
            placeholder="Digite a idade do paciente..."
            keyboardType="numeric" // Garante teclado numérico
            handleChangeText={(e) => setForm({ ...form, age: e })}
            otherStyles="mt-7"
          />

          {/* Campo Sexo */}
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

          {/* NOVO CAMPO: Possui Marcapasso */}
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

          {/* NOVO CAMPO: Prioridade */}
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
                      onPress={() => setForm({ ...form, priority: 'Eminente' })}
                      className={`py-2 px-5 rounded-lg ${form.priority === 'Eminente' ? 'bg-orange-500' : 'bg-gray-800 border border-gray-700'}`}
                  >
                      <Text className="text-white font-pmedium">Eletivo</Text>
                  </TouchableOpacity>
              </View>
          </View>

          {/* Seleção da Imagem do Eletrocardiograma */}
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

          {/* Campo Observações */}
          <FormField
            title="Caso Clínico"
            value={form.notes}
            placeholder="Descreva quaisquer observações importantes sobre o exame..."
            handleChangeText={(e) => setForm({ ...form, notes: e })}
            otherStyles="mt-7"
          />

          {/* Botão de Envio */}
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
