import { ScrollView, Text, View, ImageBackground, Alert, StyleSheet } from 'react-native' // Adicionado ImageBackground e StyleSheet
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'

import { images } from '../../constants'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
// MUDANÇA AQUI: Importa a função do novo lib/firebase.js
import { createUser } from '../../lib/firebase' 
import { useGlobalContext } from '../../context/GlobalProvider'

const SignUp = () => {
  // Desestruturamos refetchUser do contexto global
  const { refetchUser } = useGlobalContext(); // Precisamos apenas de refetchUser aqui

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    if(!form.username || !form.email || !form.password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos'); // Traduzido
      return; 
    }

    setIsSubmitting(true)

    try {
      // Cria o usuário no Firebase Authentication e no Firestore
      await createUser(form.email, form.password, form.username);
      
      // Após a criação do usuário, aciona a busca de usuário novamente no GlobalProvider.
      // O GlobalProvider (que já atualizamos) se encarregará de buscar o perfil do Firestore
      // e de atualizar os estados isLogged e user.
      await refetchUser(); 

      Alert.alert('Sucesso', 'Conta criada com sucesso!'); // Traduzido
      router.replace('/home'); // Redireciona para a tela inicial
      
    } catch (error) {
      // Firebase Authentication Errors são objetos Error com uma propriedade 'code'
      let errorMessage = 'Ocorreu um erro ao criar a conta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso. Tente outro ou faça login.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca. Por favor, insira uma senha com pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Endereço de e-mail inválido.';
      } else {
        errorMessage = error.message;
      }
      Alert.alert('Erro no Registro', errorMessage);
      console.error("Erro detalhado durante o registro (Firebase):", error);
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ImageBackground
      source={images.cardio2} // Usando a imagem de fundo existente
      resizeMode="cover"
      style={StyleSheet.absoluteFillObject}
    >
      <View pointerEvents="none" className="absolute inset-0 bg-black/20 z-10" />

      <SafeAreaView className="h-full flex-1" style={{ zIndex: 2, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="w-full justify-center min-h-[100vh] px-8 my-2">
            <Image 
              source={images.Murilo1} // Mantém sua imagem personalizada
              resizeMode="contain" 
              className="w-[350px] h-[250px] mx-auto" // Centraliza a imagem
            />

            <Text className="text-2xl text-white text-semibold mt-10 font-psemibold">
              Criar Conta
            </Text>
            <FormField 
              title="Nome de Usuário" // Traduzido
              value={form.username}
              placeholder="Digite seu nome de usuário" // Adicionado placeholder
              handleChangeText={(e) => setForm({ ...form, username: e })}
              otherStyles="mt-10"
              
            />

            <FormField 
              title="Email"
              value={form.email}
              placeholder="Digite seu e-mail" // Adicionado placeholder
              handleChangeText={(e) => setForm({ ...form, email: e })}
              otherStyles="mt-7"
              keyboardType="email-address" 
            />

            <FormField 
              title="Senha" // Traduzido
              value={form.password}
              placeholder="Digite sua senha" // Adicionado placeholder
              handleChangeText={(e) => setForm({ ...form, password: e })}
              otherStyles="mt-7"
              
            />

            <CustomButton 
              title={"Cadastrar"} // Traduzido
              handlePress={submit}
              containerStyles="mt-7"
              isLoading={isSubmitting}
            />

            <View className="justify-center pt-5 flex-row gap-2">
              <Text className="text-white text-sm font-pmedium">Já tem uma conta?</Text> {/* Traduzido */}
              <Link href="/sign-in" className="text-lg font-psemibold text-secondary" >Entrar</Link> {/* Traduzido */}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  )
}

export default SignUp;
