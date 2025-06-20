import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Hook customizado para buscar dados do Firebase Firestore.
 * Abstrai a lógica de carregamento, estados (loading, data, error) e refetch.
 * * @param {function} fetchCallback Uma função assíncrona que retorna os dados do Firebase.
 * Ex: () => getAllEcgs() ou () => getUserPosts(userId)
 * @param {Array} dependencies Array de dependências para re-executar o fetch.
 * @returns {{data: Array, isLoading: boolean, refetch: function, error: Error|null}} 
 * Objeto contendo os dados, estado de carregamento, função de refetch e erro.
 */
const useFirebaseData = (fetchCallback, dependencies = []) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null); // Reseta o erro a cada nova busca
    try {
      const response = await fetchCallback();
      // Garante que a resposta é um array para evitar problemas com FlatList
      if (Array.isArray(response)) {
        setData(response);
      } else if (response === null || response === undefined) {
        setData([]); // Se a resposta é nula/indefinida, assume array vazio
      } else {
        // Se não for array, pode ser um objeto único, então encapsula em array.
        // Ou você pode ajustar a lógica aqui dependendo do que fetchCallback retorna.
        setData([response]); 
        console.warn('useFirebaseData: fetchCallback retornou um não-array. Encapsulando em array.');
      }
    } catch (err) {
      console.error("useFirebaseData: Erro ao buscar dados:", err);
      setError(err);
      setData([]); // Limpa os dados em caso de erro
      Alert.alert('Erro ao Carregar Dados', err.message || 'Ocorreu um erro ao carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies); // Re-executa o fetch quando as dependências mudam

  // Função para forçar um refetch manual
  const refetch = () => fetchData();

  return { data, isLoading, refetch, error };
};

export default useFirebaseData;
