import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPendingEcgs, updateEcgLaudation } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import FormField from '../../components/FormField'; // Reutilizando FormField
import CustomButton from '../../components/CustomButton'; // Reutilizando CustomButton
import EcgCard from '../../components/EcgCard'; // Para exibir os detalhes do ECG
import { useRouter } from 'expo-router'; // Importar useRouter para navegação
import { icons } from '../../constants'; // <<< ADICIONADO: Importação do objeto icons

const Laudo = () => {
  const { user } = useGlobalContext();
  const router = useRouter(); // Instância do router
  const [selectedPriorityType, setSelectedPriorityType] = useState(null); // 'Urgente', 'Eletivo', ou null
  const [selectedEcg, setSelectedEcg] = useState(null); // ECG selecionado para laudar
  const [loadingEcgs, setLoadingEcgs] = useState(false); // Começa como false, já que a busca inicial só ocorre com tipo selecionado
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do formulário de laudo baseado nos detalhes da imagem
  const [laudoForm, setLaudoForm] = useState({
    ritmo: '',
    fc: '',
    pr: '',
    qrs: '',
    eixo: '',
    brc: false, // Bloqueio de Ramo Completo
    brd: false, // Bloqueio de Ramo Direito
    repolarizacao: '',
    outrosAchados: '', // Campo de texto livre
    laudoFinal: '', // Campo de texto para o laudo completo
  });

  // Opções para os campos de seleção
  const ritmoOptions = [
    'Sinusal', 'Ectópico Atrial', 'Juncional', 
    'Fibrilação Atrial', 'Flutter Atrial', 'MP (Marcapasso)', 'Outro'
  ];
  const repolarizacaoOptions = [
    'Normal', 'Alterado Difuso da Repolarização Ventricular', 
    'Infradesnivelamento', 'Supradesnivelamento', 'Outro'
  ];

  // Função para buscar o PRIMEIRO ECG pendente do tipo selecionado
  const fetchAndSelectFirstEcg = async (priorityType) => {
    setLoadingEcgs(true);
    setSelectedEcg(null); // Limpa o ECG selecionado ao mudar o tipo
    setLaudoForm({ // Reseta o formulário
      ritmo: '', fc: '', pr: '', qrs: '', eixo: '',
      brc: false, brd: false, repolarizacao: '',
      outrosAchados: '', laudoFinal: '',
    });
    try {
      const ecgs = await getPendingEcgs(priorityType); // Busca por prioridade
      if (ecgs.length > 0) {
        setSelectedEcg(ecgs[0]); // Seleciona o primeiro da lista
      } else {
        setSelectedEcg(null); // Nenhum ECG encontrado para este tipo
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os exames pendentes.');
      console.error('Erro ao buscar ECGs pendentes:', error);
    } finally {
      setLoadingEcgs(false);
    }
  };

  // Efeito para buscar e selecionar ECG quando a prioridade muda
  useEffect(() => {
    if (user?.role === 'medico' && selectedPriorityType) {
      fetchAndSelectFirstEcg(selectedPriorityType);
    }
  }, [user, selectedPriorityType]);

  // Função para submeter o laudo
  const submitLaudo = async () => {
    if (!selectedEcg) {
      Alert.alert('Erro', 'Nenhum ECG selecionado para laudar.');
      return;
    }
    if (!laudoForm.laudoFinal) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o campo de Laudo Final.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Cria um objeto com os detalhes estruturados do laudo
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
        selectedEcg.$id,
        laudoForm.laudoFinal,
        user.$id, // ID do médico logado
        structuredLaudationDetails // Passa os detalhes estruturados
      );
      
      Alert.alert('Sucesso', 'Laudo enviado com sucesso!');
      setSelectedEcg(null); // Desseleciona o ECG
      // Após laudar, busca o próximo ECG da mesma prioridade
      fetchAndSelectFirstEcg(selectedPriorityType); 
      setLaudoForm({ // Reseta o formulário
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

  // Componente de seleção de rádio (opcional, para Ritmo e Repolarização)
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

  // Função para lidar com o botão "Voltar"
  const handleBack = () => {
    if (selectedEcg) {
      // Se um ECG está selecionado, volta para a seleção de prioridade/lista
      setSelectedEcg(null);
    } else if (selectedPriorityType) {
      // Se um tipo de prioridade está selecionado, volta para a tela de escolha de tipo
      setSelectedPriorityType(null);
    }
    else {
      // Se não há ECG selecionado nem prioridade, navega para a aba 'home'
      // Isso evita o erro GO_BACK não tratado em navegadores de abas
      router.push('/home'); // <<< ALTERADO: Agora navega explicitamente para /home
    }
  };


  return (
    <SafeAreaView className="bg-primary h-full flex-1">
      <ScrollView className="px-4 my-6">
        {/* Botão de Voltar */}
        <TouchableOpacity onPress={handleBack} className="flex-row items-center mb-6">
          <Image source={icons.leftArrow} className="w-6 h-6 mr-2" resizeMode="contain" tintColor="#FFFFFF" />
          <Text className="text-white text-base font-pmedium">Voltar</Text>
        </TouchableOpacity>

        <Text className="text-2xl text-white font-psemibold mb-6">
          Laudar Eletrocardiogramas
        </Text>

        {!selectedPriorityType ? ( // Se nenhum tipo de prioridade foi selecionado
          <View className="flex-1 justify-center items-center h-80">
            <Text className="text-xl text-white font-pmedium mb-4">Escolha o tipo de laudo:</Text>
            <View className="flex-row space-x-4 mt-4">
              <CustomButton
                title="Laudar Urgente"
                handlePress={() => setSelectedPriorityType('Urgente')}
                containerStyles="bg-red-600 flex-1" // Ajustado para ser metade da largura
              />
              <CustomButton
                title="Laudar Eletivo"
                handlePress={() => setSelectedPriorityType('Eletivo')}
                containerStyles="bg-orange-500 flex-1" // Ajustado para ser metade da largura
              />
            </View>
          </View>
        ) : loadingEcgs ? ( // Se um tipo foi selecionado e está carregando
          <ActivityIndicator size="large" color="#FFA001" className="mt-10" />
        ) : !selectedEcg ? ( // Se um tipo foi selecionado, mas nenhum ECG encontrado
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
        ) : ( // Se um ECG foi selecionado (automaticamente)
          <View className="mt-8 p-4 bg-black-100 rounded-xl border-2 border-black-200">
            <Text className="text-xl text-white font-psemibold mb-4">Laudar ECG de {selectedEcg.patientName}</Text>
            
            {/* Exibir imagem e detalhes do ECG selecionado */}
            <Image
              source={{ uri: selectedEcg.imageUrl }}
              className="w-full h-64 rounded-lg mb-4"
              resizeMode="contain"
            />
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
              onSelect={(option) => setLaudoForm({ ...laudoForm, ritmo: option })}
            />

            <FormField
              title="FC (bpm)"
              value={laudoForm.fc}
              placeholder="Frequência Cardíaca..."
              handleChangeText={(e) => setLaudoForm({ ...laudoForm, fc: e })}
              keyboardType="numeric"
              otherStyles="mt-7"
            />
            <FormField
              title="PR (ms)"
              value={laudoForm.pr}
              placeholder="Intervalo PR..."
              handleChangeText={(e) => setLaudoForm({ ...laudoForm, pr: e })}
              keyboardType="numeric"
              otherStyles="mt-7"
            />
            <FormField
              title="QRS (ms)"
              value={laudoForm.qrs}
              placeholder="Duração QRS..."
              handleChangeText={(e) => setLaudoForm({ ...laudoForm, qrs: e })}
              keyboardType="numeric"
              otherStyles="mt-7"
            />
            <FormField
              title="Eixo"
              value={laudoForm.eixo}
              placeholder="Eixo elétrico (ex: 90°)..."
              handleChangeText={(e) => setLaudoForm({ ...laudoForm, eixo: e })}
              otherStyles="mt-7"
            />

            {/* Checkboxes para BRC / BRD */}
            <View className="mt-7">
              <Text className="text-base text-gray-100 font-pmedium mb-2">Bloqueios de Ramo</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => setLaudoForm({ ...laudoForm, brc: !laudoForm.brc })}
                  className={`py-2 px-5 rounded-lg ${laudoForm.brc ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
                >
                  <Text className="text-white font-pmedium">BRC</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLaudoForm({ ...laudoForm, brd: !laudoForm.brd })}
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
              onSelect={(option) => setLaudoForm({ ...laudoForm, repolarizacao: option })}
            />

            <FormField
              title="Outros Achados"
              value={laudoForm.outrosAchados}
              placeholder="Descreva outros achados não listados..."
              handleChangeText={(e) => setLaudoForm({ ...laudoForm, outrosAchados: e })}
              otherStyles="mt-7"
              multiline={true} // Campo de texto de múltiplas linhas
              numberOfLines={4} // Altura inicial do campo
            />

            <FormField
              title="Laudo Final Completo"
              value={laudoForm.laudoFinal}
              placeholder="Escreva o laudo completo do ECG aqui..."
              handleChangeText={(e) => setLaudoForm({ ...laudoForm, laudoFinal: e })}
              otherStyles="mt-7"
              multiline={true} // Campo de texto de múltiplas linhas
              numberOfLines={10} // Altura inicial do campo
            />

            <CustomButton
              title="Submeter Laudo"
              handlePress={submitLaudo}
              containerStyles="mt-7 mb-10"
              isLoading={isSubmitting}
            />

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Laudo;
