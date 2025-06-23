import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, StatusBar } from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField'; 
import CustomButton from '../../components/CustomButton'; 
import EcgCard from '../../components/EcgCard'; 
import { icons } from '../../constants'; 
import { getPendingEcgs, updateEcgLaudation, getEcgById } from '../../lib/firebase'; 
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router'; 
import Modal from 'react-native-modal'; // Ainda usaremos este Modal para envolver o ImageViewer

// >>> IMPORTAÇÃO DA NOVA BIBLIOTECA PARA ZOOM E ROTAÇÃO <<<
import ImageViewer from 'react-native-image-zoom-viewer'; 

const Laudo = () => {
  const { user } = useGlobalContext();
  const router = useRouter(); 
  const [selectedPriorityType, setSelectedPriorityType] = useState(null); 
  const [selectedEcg, setSelectedEcg] = useState(null); 
  const [loadingEcgs, setLoadingEcgs] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Novo estado para controlar a visibilidade do modal da imagem
  const [showFullImage, setShowFullImage] = useState(false); 

  const [laudoForm, setLaudoForm] = useState({
    ritmo: '',
    fc: '',
    pr: '',
    qrs: '',
    eixo: '',
    brc: false, 
    brd: false, 
    repolarizacao: '',
    outrosAchados: '', 
    laudoFinal: '', 
  });

  const ritmoOptions = [
    'Sinusal', 'Ectópico Atrial', 'Juncional', 
    'Fibrilação Atrial', 'Flutter Atrial', 'MP (Marcapasso)', 'Outro'
  ];
  const repolarizacaoOptions = [
    'Normal', 'Alterado Difuso da Repolarização Ventricular', 
    'Infradesnivelamento', 'Supradesnivelamento', 'Outro'
  ];

  const generateLaudoFinal = (currentForm) => {
    let finalContent = [];

    if (currentForm.ritmo) {
      finalContent.push(`Ritmo: ${currentForm.ritmo}.`);
    }
    if (currentForm.fc) {
      finalContent.push(`Frequência Cardíaca: ${currentForm.fc} bpm.`);
    }
    if (currentForm.pr) {
      finalContent.push(`Intervalo PR: ${currentForm.pr} ms.`);
    }
    if (currentForm.qrs) {
      finalContent.push(`Duração QRS: ${currentForm.qrs} ms.`);
    }
    if (currentForm.eixo) {
      finalContent.push(`Eixo elétrico: ${currentForm.eixo}.`);
    }
    let bloqueios = [];
    if (currentForm.brc) {
      bloqueios.push('Bloqueio de Ramo Completo (BRC)');
    }
    if (currentForm.brd) {
      bloqueios.push('Bloqueio de Ramo Direito (BRD)');
    }
    if (bloqueios.length > 0) {
      finalContent.push(`Bloqueios de Ramo: ${bloqueios.join(' e ')}.`);
    }
    if (currentForm.repolarizacao) {
      finalContent.push(`Repolarização: ${currentForm.repolarizacao}.`);
    }
    if (currentForm.outrosAchados) {
      finalContent.push(`Outros Achados: ${currentForm.outrosAchados}.`);
    }

    return finalContent.join('\n'); 
  };

  const updateFormAndGenerateLaudo = (field, value) => { 
    setLaudoForm(prevForm => {
      const updatedForm = { ...prevForm, [field]: value };
      if (field !== 'laudoFinal') { 
        updatedForm.laudoFinal = generateLaudoFinal(updatedForm);
      }
      return updatedForm;
    });
  };

  const fetchAndSelectFirstEcg = useCallback(async (priorityType) => {
    setLoadingEcgs(true);
    setSelectedEcg(null); 
    setLaudoForm({ 
      ritmo: '', fc: '', pr: '', qrs: '', eixo: '',
      brc: false, brd: false, repolarizacao: '',
      outrosAchados: '', laudoFinal: '',
    });
    try {
      const ecgs = await getPendingEcgs(priorityType); 
      if (ecgs.length > 0) {
        setSelectedEcg(ecgs[0]); 
      } else {
        setSelectedEcg(null); 
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os exames pendentes.');
      console.error('Erro ao buscar ECGs pendentes:', error);
    } finally {
      setLoadingEcgs(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'medico' && selectedPriorityType) {
      fetchAndSelectFirstEcg(selectedPriorityType);
    }
  }, [user, selectedPriorityType, fetchAndSelectFirstEcg]);

  const submitLaudo = async () => {
    if (!selectedEcg) {
      Alert.alert('Erro', 'Nenhum ECG selecionado para laudar.');
      return;
    }
    if (!laudoForm.laudoFinal) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o campo de Laudo Final.');
      return;
    }
    if (!user || !user.uid) { 
      Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const structuredLaudationDetails = {
        ritmo: laudoForm.ritmo,
        fc: laudoForm.fc,
        pr: laudoForm.pr,
        qrs: laudoForm.qrs,
        eixo: laudoForm.eixo,
        brc: laudoForm.brc,
        brd: laudoForm.brd,
        repolarizacao: laudoForm.repolarizacao,
        outrosAchados: laudoForm.outrosAchados,
      };

      await updateEcgLaudation(
        selectedEcg.id, 
        laudoForm.laudoFinal,
        user.uid, 
        structuredLaudationDetails 
      );
      
      Alert.alert('Sucesso', 'Laudo enviado com sucesso!');
      setSelectedEcg(null); 
      fetchAndSelectFirstEcg(selectedPriorityType); 
      setLaudoForm({ 
        ritmo: '', fc: '', pr: '', qrs: '', eixo: '',
        brc: false, brd: false, repolarizacao: '',
        outrosAchados: '', laudoFinal: '',
      });
    } catch (error) {
      Alert.alert('Erro no Laudo', error.message);
      console.error('Erro ao submeter laudo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RadioGroup = ({ label, options, selectedOption, onSelect }) => (
    <View className="mt-7">
      <Text className="text-base text-gray-100 font-pmedium mb-2">{label}</Text>
      <View className="flex-row flex-wrap">
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onSelect(option)}
            className={`py-2 px-4 rounded-lg mr-2 mb-2 ${
              selectedOption === option ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'
            }`}
          >
            <Text className="text-white font-pmedium">{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleBack = () => {
    router.replace('/home'); 
  };

  const handleOpenChat = () => {
    if (selectedEcg && selectedEcg.id) { 
      router.push(`/medico/chat/${selectedEcg.id}`); 
    } else {
      Alert.alert('Erro', 'Selecione um ECG para abrir o chat.');
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full flex-1">
      <ScrollView className="px-4 my-6">
        <TouchableOpacity onPress={handleBack} className="flex-row items-center mb-6">
          <Image source={icons.leftArrow} className="w-6 h-6 mr-2" resizeMode="contain" tintColor="#FFFFFF" />
          <Text className="text-white text-base font-pmedium">Voltar para Home</Text>
        </TouchableOpacity>

        <Text className="text-2xl text-white font-psemibold mb-6">
          Laudar Eletrocardiogramas
        </Text>

        {!selectedPriorityType ? ( 
          <View className="flex-1 justify-center items-center h-80">
            <Text className="text-xl text-white font-pmedium mb-4">Escolha o tipo de laudo:</Text>
            <View className="flex-row space-x-4 mt-4">
              <CustomButton
                title="Laudar Urgente"
                handlePress={() => setSelectedPriorityType('Urgente')}
                containerStyles="bg-red-600 w-1/2" 
              />
              <CustomButton
                title="Laudar Eletivo"
                handlePress={() => setSelectedPriorityType('Eletivo')}
                containerStyles="bg-orange-500 w-1/2" 
              />
            </View>
          </View>
        ) : loadingEcgs ? ( 
          <ActivityIndicator size="large" color="#FFA001" className="mt-10" />
        ) : !selectedEcg ? ( 
          <View className="flex-1 justify-center items-center h-40">
            <Text className="text-gray-100 font-pmedium text-lg">
              Não há ECGs "{selectedPriorityType}" pendentes de laudo.
            </Text>
            <CustomButton
              title="Voltar para Tipos de Laudo"
              handlePress={() => setSelectedPriorityType(null)}
              containerStyles="mt-4 bg-gray-700"
            />
          </View>
        ) : ( 
          <View className="mt-8 p-4 bg-black-100 rounded-xl border-2 border-black-200">
            <Text className="text-xl text-white font-psemibold mb-4">Laudar ECG de {selectedEcg.patientName}</Text>
            
            {/* TouchableOpacity para abrir a imagem em tela cheia com zoom */}
            <TouchableOpacity onPress={() => setShowFullImage(true)} className="w-full h-64 rounded-lg mb-4">
              <Image
                source={{ uri: selectedEcg.imageUrl }}
                className="w-full h-full"
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <View className="mb-4">
              <Text className="text-gray-100 font-pregular">Idade: {selectedEcg.age}</Text>
              <Text className="text-gray-100 font-pregular">Sexo: {selectedEcg.sex}</Text> 
              <Text className="text-gray-100 font-pregular">Marcapasso: {selectedEcg.hasPacemaker}</Text>
              <Text className="text-gray-100 font-pregular">Prioridade: {selectedEcg.priority}</Text>
              {selectedEcg.notes && <Text className="text-gray-100 font-pregular">Notas: {selectedEcg.notes}</Text>}
            </View>

            {/* --- Formulário de Laudo --- */}

            <RadioGroup
              label="Ritmo"
              options={ritmoOptions}
              selectedOption={laudoForm.ritmo}
              onSelect={(option) => updateFormAndGenerateLaudo('ritmo', option)}
            />

            <FormField
              title="FC (bpm)"
              value={laudoForm.fc}
              placeholder="Frequência Cardíaca..."
              handleChangeText={(e) => updateFormAndGenerateLaudo('fc', e)}
              keyboardType="numeric"
              otherStyles="mt-7"
            />
            <FormField
              title="PR (ms)"
              value={laudoForm.pr}
              placeholder="Intervalo PR..."
              handleChangeText={(e) => updateFormAndGenerateLaudo('pr', e)}
              keyboardType="numeric"
              otherStyles="mt-7"
            />
            <FormField
              title="QRS (ms)"
              value={laudoForm.qrs}
              placeholder="Duração QRS..."
              handleChangeText={(e) => updateFormAndGenerateLaudo('qrs', e)}
              keyboardType="numeric"
              otherStyles="mt-7"
            />
            <FormField
              title="Eixo"
              value={laudoForm.eixo}
              placeholder="Eixo elétrico (ex: 90°)..."
              handleChangeText={(e) => updateFormAndGenerateLaudo('eixo', e)}
              otherStyles="mt-7"
            />

            {/* Checkboxes para BRC / BRD */}
            <View className="mt-7">
              <Text className="text-base text-gray-100 font-pmedium mb-2">Bloqueios de Ramo</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => updateFormAndGenerateLaudo('brc', !laudoForm.brc)}
                  className={`py-2 px-5 rounded-lg ${laudoForm.brc ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
                >
                  <Text className="text-white font-pmedium">BRC</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateFormAndGenerateLaudo('brd', !laudoForm.brd)}
                  className={`py-2 px-5 rounded-lg ${laudoForm.brd ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
                >
                  <Text className="text-white font-pmedium">BRD</Text>
                </TouchableOpacity>
              </View>
            </View>

            <RadioGroup
              label="Repolarização"
              options={repolarizacaoOptions}
              selectedOption={laudoForm.repolarizacao}
              onSelect={(option) => updateFormAndGenerateLaudo('repolarizacao', option)}
            />

            <FormField
              title="Outros Achados"
              value={laudoForm.outrosAchados}
              placeholder="Descreva outros achados não listados..."
              handleChangeText={(e) => updateFormAndGenerateLaudo('outrosAchados', e)} 
              otherStyles="mt-7"
              multiline={true} 
              numberOfLines={4} 
            />

            <FormField
              title="Laudo Final Completo"
              value={laudoForm.laudoFinal}
              placeholder="Escreva o laudo completo do ECG aqui..."
              handleChangeText={(e) => updateFormAndGenerateLaudo('laudoFinal', e)}
              otherStyles="mt-7"
              multiline={true} 
              numberOfLines={10} 
            />

            <CustomButton
              title="Submeter Laudo"
              handlePress={submitLaudo}
              containerStyles="mt-7"
              isLoading={isSubmitting}
            />

            <CustomButton
              title="Abrir Chat sobre este ECG"
              handlePress={handleOpenChat}
              containerStyles="mt-4 mb-10 bg-green-600" 
            />

          </View>
        )}
      </ScrollView>

      {/* Modal para Visualização da Imagem em Tela Cheia com Zoom e Rotação */}
      <Modal 
        isVisible={showFullImage}
        // Usamos um handler para o evento de fechamento do modal
        // 'onBackdropPress' e 'onSwipeComplete' do react-native-modal não são ideais aqui,
        // pois ImageViewer tem seus próprios controles de gesture.
        // O botão 'X' é a forma primária de fechar.
        onModalHide={() => {
            // Garante que a StatusBar volte ao normal após o modal
            StatusBar.setHidden(false);
        }}
        onModalWillShow={() => {
            // Esconde a StatusBar ao mostrar o modal
            StatusBar.setHidden(true);
        }}
        // Garante que o modal ocupe a tela inteira
        style={{ margin: 0, backgroundColor: 'black' }} 
      >
        {selectedEcg && (
          // ImageViewer para zoom e pan
          <ImageViewer
            imageUrls={[{ url: selectedEcg.imageUrl }]}
            enableSwipeDown={true} // Permite arrastar para baixo para fechar
            onSwipeDown={() => setShowFullImage(false)} // Fecha o modal ao arrastar para baixo
            renderIndicator={() => null} // Remove o indicador de página (se houver apenas 1 imagem)
            // Renderiza um cabeçalho customizado para o botão de fechar
            renderHeader={() => (
              <SafeAreaView className="absolute top-0 left-0 right-0 z-50 p-4">
                <TouchableOpacity
                  onPress={() => setShowFullImage(false)}
                  className="p-3 rounded-full bg-gray-800 self-end" // Alinha à direita
                >
                  <Image source={icons.close} className="w-6 h-6" tintColor="#FFFFFF" />
                </TouchableOpacity>
              </SafeAreaView>
            )}
            // Estilos para o ImageViewer (garantir que ele ocupe a tela)
            style={{ flex: 1, backgroundColor: 'black' }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default Laudo;
