import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import React from 'react';
import { useFocusEffect } from '@react-navigation/native';

export default function DinamicaTab() {
  const { user } = useGlobalContext();
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      if (user?.role === 'enfermeiro') {
        router.replace('/enfermeiro/create');
      } else if (user?.role === 'medico') {
        router.replace('/medico/laudo');
      }
    }, [user, router])
  );

  return null;
}