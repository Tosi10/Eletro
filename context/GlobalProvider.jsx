import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, getUserProfile } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Começa como true

  // Função para encapsular a lógica de busca do usuário
  // Agora pode ser chamada de fora para re-buscar o usuário
  const fetchUser = async () => {
    console.log('GlobalProvider: Iniciando verificação de usuário...');
    setLoading(true); // Garante que loading é true no início da busca
    let fetchedUser = null; 

    try {
      const currentUserAppwrite = await getCurrentUser();

      if (currentUserAppwrite) {
        const userProfileDocument = await getUserProfile(currentUserAppwrite.$id);

        if (userProfileDocument) {
          fetchedUser = userProfileDocument; 
          setIsLogged(true);
          console.log('GlobalProvider: Usuário autenticado e perfil carregado. Detalhes do perfil:', JSON.stringify(userProfileDocument, null, 2));
          console.log('GlobalProvider: Role do usuário:', userProfileDocument.role);
        } else {
          console.warn('GlobalProvider: Conta Appwrite encontrada, mas documento de perfil não na coleção de usuários.');
          setIsLogged(false);
        }
      } else {
        console.log('GlobalProvider: Nenhuma sessão ativa. Usuário não autenticado.');
        setIsLogged(false);
      }
    } catch (error) {
      if (
        error?.message?.includes('missing scope(account)') ||
        error?.message?.includes('User (role: guests) missing scope (account)')
      ) {
        console.log('GlobalProvider: Usuário não autenticado (guest).');
      } else {
        console.error('GlobalProvider: Erro inesperado no fetchUser:', error);
      }
      setIsLogged(false); 
    } finally {
      setUser(fetchedUser); 
      setLoading(false); 
      console.log('GlobalProvider: Verificação de usuário finalizada.');
    }
  };

  useEffect(() => {
    fetchUser(); // Chamada inicial ao montar o componente
  }, []); // Sem dependências para rodar apenas uma vez na montagem

  // Adicionamos 'refetchUser: fetchUser' ao valor do contexto
  return (
    <GlobalContext.Provider value={{ isLogged, setIsLogged, user, setUser, isLoading: loading, refetchUser: fetchUser }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
