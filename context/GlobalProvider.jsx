// context/GlobalProvider.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
// Importa auth, db, doc, getCurrentUser, ensureUserProfile do novo lib/firebase.js
import { auth, db, doc, getCurrentUser, ensureUserProfile } from "../lib/firebase"; 
import { onAuthStateChanged, getAuth } from "firebase/auth"; // getAuth adicionado para garantir instância de auth


const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Começa como true

  // Função para encapsular a lógica de busca do usuário
  // Agora pode ser chamada de fora para re-buscar o usuário e garantir o perfil
  const fetchUser = async () => {
    console.log('GlobalProvider: Iniciando verificação de usuário Firebase...');
    setLoading(true); 
    let fetchedUser = null; 

    try {
      // getCurrentUser do nosso lib/firebase já usa onAuthStateChanged e busca o perfil do Firestore.
      fetchedUser = await getCurrentUser(); // Esta função já lida com a persistência e busca o perfil

      if (fetchedUser) {
        setIsLogged(true);
        console.log('GlobalProvider: Usuário autenticado e perfil carregado. Detalhes do perfil:', JSON.stringify(fetchedUser, null, 2));
      } else {
        setIsLogged(false);
        console.log('GlobalProvider: Nenhuma sessão ativa no Firebase. Usuário não autenticado.');
      }
    } catch (error) {
      console.error('GlobalProvider: Erro inesperado no fetchUser Firebase:', error);
      setIsLogged(false); 
    } finally {
      setUser(fetchedUser); 
      setLoading(false); 
      console.log('GlobalProvider: Verificação de usuário Firebase finalizada.');
    }
  };

  useEffect(() => {
    // Este listener é a forma mais robusta de lidar com o estado de autenticação do Firebase.
    // Ele é acionado na inicialização do app (para verificar persistência) e em mudanças de estado (login/logout).
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Se há um usuário autenticado (authUser), buscamos/garantimos seu perfil no Firestore
        try {
          const userProfile = await ensureUserProfile(authUser);
          setUser(userProfile);
          setIsLogged(true);
          console.log('GlobalProvider (onAuthStateChanged): Usuário autenticado e perfil carregado/garantido.', userProfile?.uid);
        } catch (error) {
          console.error('GlobalProvider (onAuthStateChanged): Erro ao garantir perfil:', error);
          setUser(null);
          setIsLogged(false);
        }
      } else {
        // Se não há usuário autenticado
        setUser(null);
        setIsLogged(false);
        console.log('GlobalProvider (onAuthStateChanged): Nenhum usuário autenticado.');
      }
      setLoading(false); // O carregamento inicial é finalizado aqui
    });

    // Retorna uma função para cancelar a subscrição do listener quando o componente é desmontado
    return () => unsubscribe();
  }, []); // Array de dependências vazio para que rode apenas na montagem

  // Adicionamos 'refetchUser: fetchUser' ao valor do contexto
  return (
    <GlobalContext.Provider value={{ isLogged, setIsLogged, user, setUser, isLoading: loading, refetchUser: fetchUser }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
