import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, getUserProfile } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      console.log('GlobalProvider: Iniciando verificação de usuário...');
      try {
        const currentUserAppwrite = await getCurrentUser();

        if (currentUserAppwrite) {
          // Busca o perfil do usuário na coleção de usuários
          const userProfileDocument = await getUserProfile(currentUserAppwrite.$id);

          if (userProfileDocument) {
            setUser(userProfileDocument);
            setIsLogged(true);
            console.log('GlobalProvider: Usuário autenticado e perfil carregado.', userProfileDocument);
          } else {
            // Caso raro: usuário Appwrite existe, mas não tem perfil na coleção
            console.warn('GlobalProvider: Conta Appwrite encontrada, mas documento de perfil não na coleção de usuários.');
            setUser(null);
            setIsLogged(false);
          }
        } else {
          // Usuário não logado ou sessão expirada
          console.log('GlobalProvider: Nenhuma sessão ativa. Usuário não autenticado.');
          setUser(null);
          setIsLogged(false);
        }
      } catch (error) {
        // Trata erro de sessão expirada ou usuário guest sem scope
        if (
          error?.message?.includes('missing scope(account)') ||
          error?.message?.includes('User (role: guests) missing scope (account)')
        ) {
          console.log('GlobalProvider: Usuário não autenticado (guest).');
        } else {
          console.error('GlobalProvider: Erro inesperado no fetchUser:', error);
        }
        setUser(null);
        setIsLogged(false);
      } finally {
        setLoading(false);
        console.log('GlobalProvider: Verificação de usuário finalizada.');
      }
    };

    fetchUser();
  }, []);

  return (
    <GlobalContext.Provider value={{ isLogged, setIsLogged, user, setUser, isLoading: loading }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;