import { useEffect, useState, useCallback } from 'react'; // Adicionado useCallback
import { Alert } from 'react-native';

/**
 * Hook customizado para buscar dados do Firebase Firestore.
 * Abstrai a lógica de carregamento, estados (loading, data, error) e refetch.
 * @param {function} fetchCallback Uma função assíncrona que retorna os dados do Firebase.
 * Ex: () => getAllEcgs() ou () => getUserPosts(userId)
 * @param {Array} dependencies Array de dependências para re-executar o fetch.
 * @returns {{data: Array, isLoading: boolean, refetch: function, error: Error|null}} 
 * Objeto contendo os dados, estado de carregamento, função de refetch e erro.
 */
const useFirebaseData = (fetchCallback, dependencies = []) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null); 
    try {
      const response = await fetchCallback();
      if (Array.isArray(response)) {
        setData(response);
      } else if (response === null || response === undefined) {
        setData([]); 
      } else {
        setData([response]); 
        console.warn('useFirebaseData: fetchCallback retornou um não-array. Encapsulando em array.');
      }
    } catch (err) {
      console.error("useFirebaseData: Erro ao buscar dados:", err);
      setError(err);
      setData([]); 
      Alert.alert('Erro ao Carregar Dados', err.message || 'Ocorreu um erro ao carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCallback, ...dependencies]); // Depende da função de callback e de outras dependências.

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Re-executa o fetch quando a função fetchData (que é memoizada) muda

  const refetch = () => fetchData();

  return { data, isLoading, refetch, error };
};

export default useFirebaseData;
