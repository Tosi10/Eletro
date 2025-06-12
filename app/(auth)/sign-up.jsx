import { ScrollView, Text, View, Image, Alert } from 'react-native' // Removido StyleSheet
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'

import { images } from '../../constants'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
import { createUser } from '../../lib/appwrite'
import { useGlobalContext } from '../../context/GlobalProvider'

const SignUp = () => {
  // Desestruturamos refetchUser do contexto global
  const { setUser, setIsLogged, refetchUser } = useGlobalContext();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    if(!form.username || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill all fields')
      return; // Adicionado return para parar a execução
    }

    setIsSubmitting(true)

    try {
      // Cria o usuário no Appwrite
      await createUser(form.email, form.password, form.username);
      
      // Após a criação do usuário, aciona a busca de usuário novamente no GlobalProvider
      // Isso garantirá que o objeto 'user' no contexto global seja atualizado com o role
      await refetchUser(); 

      // As linhas abaixo são redundantes se refetchUser for bem-sucedido,
      // pois o refetchUser já vai setar o user e isLogged no contexto.
      // Comentei-as para clareza, mas podem ser mantidas se houver um motivo específico.
      // const currentUser = await getCurrentUser(); // Esta linha não é necessária após createUser
      // setUser(result); // result é a conta Appwrite, não o perfil completo com role
      // setIsLogged(true);

      Alert.alert('Success', 'Account created successfully!'); // Mensagem de sucesso
      router.replace('/home'); // Redireciona para a tela inicial
      
    } catch (error) {
      Alert.alert('Error', error.message)
      console.error("Erro durante o processo de registro:", error); // Adicionado console.error
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="bg-blue-900 h-full">
        <ScrollView>
          <View className="w-full justify-center min-h-[100vh] px-8 my-2">
            <Image source={images.Murilo1} resizeMode="contain" className=" w-[350px] h-[250px]" />

            <Text className="text-2xl text-white text-semibold mt-10 font-psemibold">
              Sign up 
            </Text>
            <FormField 
              title="Username"
              value={form.username}
              handleChangeText={(e) => setForm({ ...form, username: e })}
              otherStyles="mt-10"
              
            />

            <FormField 
              title="Email"
              value={form.email}
              handleChangeText={(e) => setForm({ ...form, email: e })}
              otherStyles="mt-7"
              keyboardType="email-address" 
            />

            <FormField 
              title="Password"
              value={form.password}
              handleChangeText={(e) => setForm({ ...form, password: e })}
              otherStyles="mt-7"
              
            />

            <CustomButton 
              title={"Sign Up"}
              handlePress={submit}
              containerStyles="mt-7"
              isLoading={isSubmitting}
            />

            <View className="justify-center pt-5 flex-row gap-2">
              <Text className="text-white text-sm font-pmedium">Have an account already?</Text>
              <Link href="/sign-in" className="text-lg font-psemibold text-secondary" >Sign in</Link> 
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp;
