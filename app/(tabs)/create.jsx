import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';
import { createEcg } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import * as imagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker'; // Importe para o seletor de data

const Create = () => {
  const { user } = useGlobalContext();
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false); // Novo estado para controlar o seletor de data

  const [form, setForm] = useState({
    patientName: '', // Novo campo para o nome do paciente
    examDate: new Date(), // Novo campo, inicializado com a data atual
    ecgFile: null, // Renomeado de 'ecg' para ser mais claro (objeto do ImagePicker)
    notes: '', // Renomeado de 'description' para ser mais claro (observações)
  });

  // Função para lidar com a mudança de data no DateTimePicker
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || form.examDate;
    setShowDatePicker(false); // Esconde o seletor após a seleção
    setForm({ ...form, examDate: currentDate });
  };

  // Função para mostrar o DateTimePicker
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Função para abrir o seletor de imagem
  const openPicker = async () => {
    const result = await imagePicker.launchImageLibraryAsync({
      mediaTypes: imagePicker.MediaTypeOptions.Images,
      quality: 1, // Qualidade da imagem
      // allowsEditing: true, // Opcional: permite editar a imagem antes de selecionar
      // aspect: [4, 3], // Opcional: proporção da imagem
    });

    if (!result.canceled) {
      setForm((prev) => ({
        ...prev,
        ecgFile: result.assets[0], // Pega o primeiro asset (se for uma única seleção)
      }));
    } else {
        Alert.alert('Atenção', 'Nenhuma imagem selecionada.');
    }
  };

  // Função para enviar o formulário
  const submit = async () => {
    if (!user) {
      return Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
    }
    // Validação de todos os campos obrigatórios
    if (!form.patientName || !form.examDate || !form.ecgFile || !form.notes) {
      return Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos e selecione a imagem do ECG.');
    }

    setUploading(true); // Inicia o estado de upload

    try {
      // Chama a função createEcg do Appwrite com os dados do formulário
      await createEcg({
        patientName: form.patientName,
        examDate: form.examDate,
        ecgFile: form.ecgFile, // O objeto do arquivo de imagem
        notes: form.notes,
        uploaderId: user.$id, // ID da enfermeira que está enviando
      });

      Alert.alert('Sucesso', 'ECG enviado para laudo com sucesso!');
      router.push('/home'); // Redireciona para a tela inicial (ou outra tela de sucesso)
      // Reseta o formulário após o sucesso
      setForm({
        patientName: '',
        examDate: new Date(),
        ecgFile: null,
        notes: ''
      });
    } catch (error) {
      Alert.alert('Erro no Upload', error.message);
      console.error('Erro detalhado no upload do ECG:', error);
    } finally {
      setUploading(false); // Finaliza o estado de upload
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
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

        {/* Campo Data do Exame */}
        <View className="mt-7 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium">
            Data do Exame
          </Text>
          <TouchableOpacity onPress={showDatepicker} className="w-full h-16 px-4 bg-black-100 rounded-2xl justify-center border-2 border-black-200">
            <Text className="text-white font-pmedium">
              {/* Exibe a data formatada para o usuário */}
              {form.examDate.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
          {/* DateTimePicker condicional */}
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={form.examDate}
              mode="date" // Apenas seleção de data
              display="default" // Estilo padrão do seletor
              onChange={onChangeDate} // Função de callback ao mudar a data
            />
          )}
        </View>

        {/* Seleção da Imagem do Eletrocardiograma */}
        <View className="mt-7 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium">
            Imagem do Eletrocardiograma
          </Text>

          <TouchableOpacity onPress={openPicker}>
            {form.ecgFile ? (
              // Mostra a imagem selecionada
              <Image
                source={{ uri: form.ecgFile.uri }}
                className="w-full h-64 rounded-2xl"
                resizeMode="cover"
              />
            ) : (
              // Placeholder para selecionar imagem
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
          title="Observações Adicionais"
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
    </SafeAreaView>
  );
};

export default Create;