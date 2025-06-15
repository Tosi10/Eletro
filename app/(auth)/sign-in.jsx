import { ScrollView, StyleSheet, Text, View, ImageBackground, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'

import { images } from '../../constants'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
import { getCurrentUser, signIn, ensureUserProfile } from '../../lib/appwrite'

import { useGlobalContext } from '../../context/GlobalProvider';

const SignIn = () => {
  // Desestruturamos refetchUser do contexto global
  const { setUser, setIsLogged, refetchUser } = useGlobalContext();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Tenta fazer o login
      await signIn(form.email, form.password);
      
      // Após o login, aciona a busca de usuário novamente no GlobalProvider
      // Isso garantirá que o objeto 'user' no contexto global seja atualizado com o role
      await refetchUser(); 

      // O refetchUser já vai setar o user e isLogged no contexto,
      // então as linhas abaixo podem ser redundantes se refetchUser for bem-sucedido.
      // No entanto, as mantemos por segurança caso o GlobalProvider mude sua implementação.
      const currentUser = await getCurrentUser(); 
      if (currentUser) {
        await ensureUserProfile(currentUser); // Garante que o perfil existe!
        // setUser(currentUser); // Já é feito pelo refetchUser
        // setIsLogged(true); // Já é feito pelo refetchUser
      }

      Alert.alert('Success', 'Login successful');
      router.replace('/home'); // Redireciona para a tela inicial
    } catch (error) {
      Alert.alert('Erro', error.message);
      console.error("Erro durante o processo de login:", error); // Adicionado console.error para mais detalhes
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
              Log in
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
              title="Password"
              value={form.password}
              placeholder="Senha" // Adicionado placeholder para clareza
              handleChangeText={(e) => setForm({ ...form, password: e })}
              otherStyles="mt-7"
              />

            <CustomButton
              title="Sign in"
              handlePress={submit}
              containerStyles="mt-7"
              isLoading={isSubmitting}
            />

            <View className="justify-center pt-5 flex-row gap-2">
              <Text className="text-white text-sm font-pmedium">Don't have an account?</Text>
              <Link href="/sign-up" className="text-lg font-psemibold text-secondary">
                Sign Up
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default SignIn;
