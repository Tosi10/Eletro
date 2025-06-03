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
      console.log('GlobalProvider: Chamando getCurrentUser...');
      try {
        const currentUser = await getCurrentUser();
        console.log('GlobalProvider: Usuário retornado pelo getCurrentUser:', currentUser);
        if (currentUser) {
          // Busca o perfil completo na coleção de usuários
          const userProfile = await getUserProfile(currentUser.$id);
          if (userProfile) {
            setUser(userProfile);
            setIsLogged(true);
          } else {
            setUser(null);
            setIsLogged(false);
          }
        } else {
          setUser(null);
          setIsLogged(false);
        }
      } catch (error) {
        console.error('GlobalProvider: Erro ao buscar usuário:', error);
        setUser(null);
        setIsLogged(false);
      } finally {
        setLoading(false);
        console.log('GlobalProvider: Finalizado o carregamento.');
      }
    };

    fetchUser();
  }, []);

  return (
    <GlobalContext.Provider value={{ isLogged, setIsLogged, user, setUser, loading }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;