import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('GlobalProvider: Chamando getCurrentUser...');
    getCurrentUser()
      .then((res) => {
        console.log('GlobalProvider: Usuário retornado pelo getCurrentUser:', res);
        if (res) {
          setIsLogged(true);
          setUser(res);
        } else {
          console.warn('GlobalProvider: Usuário não autenticado.');
          setIsLogged(false);
          setUser(null);
        }
      })
      .catch((error) => {
        console.error('GlobalProvider: Erro ao buscar usuário:', error);
      })
      .finally(() => {
        setLoading(false);
        console.log('GlobalProvider: Finalizado o carregamento.');
      });
  }, []);

  return (
    <GlobalContext.Provider value={{ isLogged, setIsLogged, user, setUser, loading }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;