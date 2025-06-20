import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
// MUDANÇA AQUI: Importa do Firebase
import { getCurrentUser, ensureUserProfile } from "../lib/firebase";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Começa como true

  // Adiciona useCallback para memorizar refetchUser, útil se passado como prop
  const fetchUser = useCallback(async () => {
    console.log('GlobalProvider: Iniciando verificação de usuário Firebase...');
    setLoading(true); // Garante que loading é true no início da busca
    let fetchedUser = null; // Variável temporária para armazenar o usuário buscado

    try {
      // getCurrentUser do Firebase já lida com a sessão e busca o perfil do Firestore
      const currentUserProfile = await getCurrentUser(); 

      if (currentUserProfile) {
        // Se um perfil foi retornado, o usuário está logado e o perfil existe/foi garantido
        fetchedUser = currentUserProfile;
        setIsLogged(true);
        console.log('GlobalProvider: Usuário autenticado e perfil carregado (Firebase). Detalhes do perfil:', JSON.stringify(currentUserProfile, null, 2));
        console.log('GlobalProvider: Role do usuário:', currentUserProfile.role);
      } else {
        console.log('GlobalProvider: Nenhum usuário Firebase logado ou perfil não encontrado.');
        setIsLogged(false);
      }
    } catch (error) {
      console.error('GlobalProvider: Erro inesperado no fetchUser (Firebase):', error);
      setIsLogged(false); // Define como não logado em caso de erro
    } finally {
      setUser(fetchedUser); 
      setLoading(false); 
      console.log('GlobalProvider: Verificação de usuário Firebase finalizada.');
    }
  }, []); // Vazio, pois não depende de props ou estados que mudam o comportamento fundamental.

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // Dependência em fetchUser (que é memoizado)

  return (
    <GlobalContext.Provider value={{ isLogged, setIsLogged, user, setUser, isLoading: loading, refetchUser: fetchUser }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
