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
  const { setUser, setIsLogged } = useGlobalContext();

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
      await signIn(form.email, form.password);
      const result = await getCurrentUser();
      if (result) {
        await ensureUserProfile(result); // Garante que o perfil existe!
        setUser(result);
        setIsLogged(true);

        Alert.alert('Success', 'Login successful');
        router.replace('/home');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="h-full flex-1">
      <ImageBackground
        source={images.cardio2}
        resizeMode="cover"
        style={{ flex: 1, width: '100%', height: '100%' }}
      >
        {/* Overlay para escurecer a imagem e melhorar a leitura */}
        <View pointerEvents="none" style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 1
        }} />

        <ScrollView contentContainerStyle={{ flexGrow: 1, zIndex: 2 }}>
          <View className="w-full justify-center min-h-[100vh] px-8 my-3">
            <Text className="text-3xl text-black text-semibold mt-10 font-psemibold">
              Log in
            </Text>

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
      </ImageBackground>
    </SafeAreaView>
  );
};

export default SignIn;