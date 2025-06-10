import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useGlobalContext } from '../../context/GlobalProvider';

const horarios = [
  '06:00', '18:00'
];

const Agenda = () => {
  const { user } = useGlobalContext();
  const [selectedDate, setSelectedDate] = useState('');
  const [agendamentos, setAgendamentos] = useState({});

  const agendar = (hora) => {
    const key = `${selectedDate}_${hora}`;
    const alunos = agendamentos[key] || [];
    if (alunos.length >= 6) return;
    if (alunos.includes(user?.name || user?.username)) return;
    setAgendamentos({
      ...agendamentos,
      [key]: [...alunos, user?.name || user?.username]
    });
  };

  return (
    <View className="flex-1 bg-blue-900 px-4 pt-8">
      <Text className="text-2xl font-bold text-white mb-4">Agenda</Text>
      <Calendar
        onDayPress={day => setSelectedDate(day.dateString)}
        markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: '#2563eb' } } : {}}
        theme={{
          backgroundColor: '#1e3a8a',
          calendarBackground: '#1e3a8a',
          dayTextColor: '#fff',
          monthTextColor: '#fff',
          selectedDayBackgroundColor: '#2563eb',
          selectedDayTextColor: '#fff',
          todayTextColor: '#60a5fa',
          arrowColor: '#fff',
          textDisabledColor: '#64748b',
        }}
      />
      {selectedDate ? (
        <>
          <Text className="mt-6 mb-2 text-lg font-semibold text-white">Horários disponíveis:</Text>
          <FlatList
            data={horarios}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const key = `${selectedDate}_${item}`;
              const alunos = agendamentos[key] || [];
              const lotado = alunos.length >= 6;
              return (
                <TouchableOpacity
                  className={`mb-2 p-4 rounded-xl ${lotado ? 'bg-gray-400' : 'bg-gray-400'}`}
                  disabled={lotado}
                  onPress={() => agendar(item)}
                >
                  <Text className="text-black text-lg">
                    {item} {lotado ? '(Lotado)' : ''}
                  </Text>
                  <Text className="text-black text-sm">
                    {alunos.length}/6 alunos: {alunos.join(', ')}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </>
      ) : (
        <Text className="mt-6 text-gray-200">Selecione uma data no calendário.</Text>
      )}
    </View>
  );
};

export default Agenda;