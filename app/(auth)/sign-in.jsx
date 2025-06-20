import { ScrollView, StyleSheet, Text, View, ImageBackground, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'

import { images } from '../../constants'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
// MUDANÇA AQUI: Importa as funções do novo lib/firebase.js
import { signIn } from '../../lib/firebase' // getCurrentUser e ensureUserProfile serão chamados no GlobalProvider

import { useGlobalContext } from '../../context/GlobalProvider';

const SignIn = () => {
  // Desestruturamos refetchUser do contexto global
  const { refetchUser } = useGlobalContext(); // Precisamos apenas de refetchUser aqui

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Tenta fazer o login com Firebase
      await signIn(form.email, form.password);
      
      // Após o login bem-sucedido no Firebase Auth, aciona a busca de usuário novamente no GlobalProvider.
      // O GlobalProvider (que já atualizamos) se encarregará de buscar o perfil do Firestore
      // e de atualizar os estados isLogged e user.
      await refetchUser(); 

      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      router.replace('/home'); // Redireciona para a tela inicial
    } catch (error) {
      // Firebase Authentication Errors são objetos Error com uma propriedade 'code'
      // É uma boa prática verificar o código para mensagens mais específicas
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Endereço de e-mail inválido.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Sua conta foi desativada.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
      } else {
        errorMessage = error.message; // Mensagem genérica se o erro não for reconhecido
      }

      Alert.alert('Erro no Login', errorMessage);
      console.error("Erro detalhado durante o login (Firebase):", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ImageBackground AGORA FORA da SafeAreaView e cobrindo toda a tela
    <ImageBackground
      source={images.cardio2}
      resizeMode="cover"
      // Estilo para cobrir 100% da largura e altura da tela
      style={StyleSheet.absoluteFillObject} // Isso fará com que a imagem preencha a tela inteira
    >
      {/* Overlay para escurecer a imagem e melhorar a leitura */}
      {/* Usando classes Tailwind para o overlay para consistência */}
      <View pointerEvents="none" className="absolute inset-0 bg-black/20 z-10" />

      {/* SafeAreaView agora envolve apenas o conteúdo que precisa de áreas seguras */}
      <SafeAreaView className="h-full flex-1" style={{ zIndex: 2, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="w-full justify-center min-h-[100vh] px-8 my-3">
            <Text className="text-3xl text-black text-semibold mt-10 font-psemibold">
              Entrar
            </Text>

            <FormField
              title="Email"
              value={form.email}
              placeholder="Email" // Adicionado placeholder para clareza
              handleChangeText={(e) => setForm({ ...form, email: e })}
              otherStyles="mt-7"
              keyboardType="email-address"
            />

            <FormField
              title="Senha" // Traduzido para 'Senha'
              value={form.password}
              placeholder="Senha" // Adicionado placeholder para clareza
              handleChangeText={(e) => setForm({ ...form, password: e })}
              otherStyles="mt-7"
              />

            <CustomButton
              title="Entrar" // Traduzido para 'Entrar'
              handlePress={submit}
              containerStyles="mt-7"
              isLoading={isSubmitting}
            />

            <View className="justify-center pt-5 flex-row gap-2">
              <Text className="text-white text-sm font-pmedium">Não tem uma conta?</Text> {/* Traduzido */}
              <Link href="/sign-up" className="text-lg font-psemibold text-secondary">
                Cadastre-se
              </Link> {/* Traduzido */}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default SignIn;
