// lib/firebase.js

// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from 'firebase/app';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, // Renomeado para evitar conflito com nossa exportação signOut
  onAuthStateChanged,
  initializeAuth, // Para configurar a persistência
  getReactNativePersistence // Para persistência no React Native
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc,     
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  updateDoc,
  onSnapshot // Para listeners em tempo real (chat)
} from 'firebase/firestore'; 
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage'; 

import AsyncStorage from '@react-native-async-storage/async-storage'; // Importa AsyncStorage

// Suas configurações do Firebase (COLE AQUI O OBJETO firebaseConfig DO SEU PROJETO)
const firebaseConfig = {
  apiKey: "AIzaSyA2h6dnrB5mrV8wi078QxaZg9n7dMbDLuk", // <<< COLOQUE SUA CHAVE AQUI
  authDomain: "ecgscan-e5a18.firebaseapp.com",
  projectId: "ecgscan-e5a18",
  storageBucket: "ecgscan-e5a18.firebasestorage.app",
  messagingSenderId: "195471348171",
  appId: "1:195471348171:web:7f23c729fc44c66834a64e"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// >>> CONFIGURAÇÃO DA PERSISTÊNCIA DE AUTENTICAÇÃO <<<
// Usa initializeAuth para configurar a persistência no React Native
// É crucial passar o AsyncStorage explicitamente aqui para que a sessão persista.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

// Exporta as instâncias para que possam ser usadas em outras partes do seu aplicativo
export { auth, db, storage };


// --- FUNÇÕES DE LÓGICA DO BACKEND COM FIREBASE ---

/**
 * Cria um novo usuário no Firebase Authentication e um documento de perfil no Firestore.
 * @param {string} email O e-mail do usuário.
 * @param {string} password A senha do usuário.
 * @param {string} username O nome de usuário.
 * @param {string} role O papel do usuário (ex: 'enfermeiro', 'medico').
 * @returns {object} O objeto de usuário do Firestore.
 */
export const createUser = async (email, password, username, role = 'enfermeiro') => {
  try {
    // 1. Cria o usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Cria um documento de perfil no Firestore para o usuário
    // Usa o UID do Firebase Auth como ID do documento no Firestore
    const userDocRef = doc(db, 'users', user.uid); 
    const userProfile = {
      uid: user.uid,
      email: user.email,
      username: username,
      avatar: `https://ui-avatars.com/api/?name=${username}&background=random`, 
      role: role, 
      createdAt: serverTimestamp(), // Usa carimbo de data/hora do servidor para consistência
    };

    await setDoc(userDocRef, userProfile); 

    console.log('Firebase: Usuário criado e perfil salvo no Firestore:', userProfile);
    return userProfile; 
  } catch (error) {
    console.error('Firebase: Erro ao criar usuário:', error.message);
    throw new Error(error.message); 
  }
};

/**
 * Autentica um usuário no Firebase Authentication.
 * @param {string} email O e-mail do usuário.
 * @param {string} password A senha do usuário.
 * @returns {object} O objeto de usuário do Firebase Auth.
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Firebase: Login bem-sucedido:', user.uid);
    return user;
  } catch (error) {
    console.error('Firebase: Erro ao fazer login:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Faz logout do usuário atual no Firebase Authentication.
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('Firebase: Logout bem-sucedido.');
  } catch (error) {
    console.error('Firebase: Erro ao fazer logout:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Obtém o usuário atualmente logado e seu perfil do Firestore.
 * Esta função é robusta para persistência de sessão e busca o perfil completo.
 * @returns {object|null} O objeto de perfil do usuário (do Firestore) ou null se não houver usuário logado.
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    // onAuthStateChanged é o listener oficial do Firebase Auth
    // Ele é acionado na mudança de estado de autenticação e também na inicialização
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Remove o listener após a primeira execução para evitar múltiplos disparos,
      // pois geralmente queremos apenas o estado inicial.
      unsubscribe(); 

      if (user) {
        try {
          // Busca o perfil do usuário no Firestore usando o UID do Auth
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            console.log('Firebase: Perfil do usuário carregado:', userDocSnap.data());
            resolve(userDocSnap.data()); // Retorna os dados do perfil do Firestore
          } else {
            console.warn('Firebase: Usuário autenticado, mas perfil não encontrado no Firestore. Criando perfil...');
            // Garante que o perfil seja criado se o usuário existir no Auth mas não no Firestore
            const newProfile = await ensureUserProfile(user); 
            resolve(newProfile);
          }
        } catch (error) {
          console.error('Firebase: Erro ao buscar/criar perfil do usuário no Firestore:', error.message);
          reject(error);
        }
      } else {
        console.log('Firebase: Nenhum usuário logado.');
        resolve(null);
      }
    }, (error) => {
      console.error('Firebase: Erro no listener de estado de autenticação:', error.message);
      reject(error);
    });
  });
};

/**
 * Garante que o perfil de um usuário exista no Firestore.
 * Utilizado após o registro ou login para ter certeza de que há um documento de perfil.
 * @param {object} userAuth O objeto de usuário retornado pelo Firebase Authentication.
 * @returns {object} O documento de perfil do usuário do Firestore.
 */
export const ensureUserProfile = async (userAuth) => {
  if (!userAuth || !userAuth.uid) {
    throw new Error('Objeto de usuário de autenticação inválido.');
  }

  const userDocRef = doc(db, 'users', userAuth.uid);
  try {
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      console.log('Firebase: Perfil do usuário já existe:', userDocSnap.data());
      return userDocSnap.data();
    } else {
      // Cria um novo perfil se não existir
      const userProfile = {
        uid: userAuth.uid,
        email: userAuth.email,
        username: userAuth.displayName || userAuth.email.split('@')[0], 
        avatar: `https://ui-avatars.com/api/?name=${userAuth.displayName || userAuth.email.split('@')[0]}&background=random`,
        role: 'enfermeiro', // Define um role padrão para novos perfis
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, userProfile);
      console.log('Firebase: Novo perfil de usuário criado:', userProfile);
      return userProfile;
    }
  } catch (error) {
    console.error('Firebase: Erro ao garantir perfil do usuário:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Faz upload de um arquivo para o Firebase Storage.
 * @param {object} file Objeto de arquivo do ImagePicker (uri, fileName, mimeType).
 * @param {string} type Tipo do arquivo (ex: 'image').
 * @returns {string} URL de download do arquivo.
 */
export const uploadFile = async (file, type) => {
  if (!file || !file.uri) {
    throw new Error('Arquivo inválido ou URI faltando para upload.');
  }

  // Define um caminho para o arquivo no Storage
  // Ex: 'ecgs/image_12345.jpg'
  const storageRef = ref(storage, `${type}s/${file.fileName || `file_${Date.now()}.${file.mimeType.split('/')[1]}`}`);

  try {
    // Converte URI em Blob
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Faz upload do Blob
    await uploadBytes(storageRef, blob);

    // Obtém a URL de download
    const fileUrl = await getDownloadURL(storageRef);

    console.log('Firebase: Arquivo enviado com sucesso:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Firebase: Erro ao fazer upload do arquivo:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Cria um novo documento de ECG no Cloud Firestore.
 * @param {object} ecgData Dados do ECG (patientName, age, sex, hasPacemaker, priority, ecgFile, notes, uploaderId).
 * @returns {string} O ID do documento do ECG criado.
 */
export async function createEcg({ patientName, age, sex, hasPacemaker, priority, ecgFile, notes, uploaderId }) {
  try {
    // 1. Faz upload da imagem do ECG para o Firebase Storage
    const imageUrl = await uploadFile(ecgFile, 'image');

    // 2. Adiciona um novo documento na coleção 'ecgs' do Firestore
    // O Firestore gerará automaticamente um ID para o documento
    const ecgCollectionRef = collection(db, 'ecgs'); // Referência à coleção 'ecgs'
    const newEcgDocumentRef = await addDoc(ecgCollectionRef, { // addDoc retorna uma DocumentReference
      patientName,
      age: parseInt(age),
      sex,
      hasPacemaker,
      priority,
      imageUrl,
      status: 'pending', // Status inicial: pendente de laudo
      notes,
      uploaderId, // O ID do usuário que fez o upload
      createdAt: serverTimestamp(), // Adiciona um carimbo de data/hora do servidor
    });

    console.log('Firebase: ECG criado no Firestore com ID:', newEcgDocumentRef.id);
    return newEcgDocumentRef.id; // Retorna APENAS o ID do novo documento
  } catch (error) {
    console.error('Firebase: Erro ao criar ECG:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Busca um ECG específico por ID no Cloud Firestore.
 * @param {string} ecgId O ID do documento do ECG.
 * @returns {object|null} O documento do ECG ou null se não for encontrado.
 */
export const getEcgById = async (ecgId) => {
  try {
    const ecgDocRef = doc(db, 'ecgs', ecgId);
    const ecgDocSnap = await getDoc(ecgDocRef);

    if (ecgDocSnap.exists()) {
      const ecgData = { id: ecgDocSnap.id, ...ecgDocSnap.data() };
      // Popula o campo creator e laudationDoctor se existirem
      if (ecgData.uploaderId) {
        const uploaderSnap = await getDoc(doc(db, 'users', ecgData.uploaderId));
        if (uploaderSnap.exists()) {
          ecgData.creator = uploaderSnap.data();
        } else {
          ecgData.creator = { username: 'Desconhecido', avatar: 'https://ui-avatars.com/api/?name=U' };
        }
      }
      if (ecgData.laudationDoctorId) {
        const doctorSnap = await getDoc(doc(db, 'users', ecgData.laudationDoctorId));
        if (doctorSnap.exists()) {
          ecgData.laudationDoctor = doctorSnap.data();
        } else {
          ecgData.laudationDoctor = { username: 'Médico Desconhecido', avatar: 'https://ui-avatars.com/api/?name=M' };
        }
      }
      return ecgData;
    } else {
      console.warn(`Firebase: ECG com ID ${ecgId} não encontrado.`);
      return null;
    }
  } catch (error) {
    console.error(`Firebase: Erro ao buscar ECG com ID ${ecgId}:`, error.message);
    throw new Error(error.message);
  }
};


/**
 * Busca todos os ECGs enviados por um usuário específico do Cloud Firestore.
 * Também popula os dados do criador (uploader) e do médico laudador (se houver).
 * @param {string} uploaderId O UID do usuário que fez o upload.
 * @returns {Array<object>} Lista de documentos de ECG.
 */
export const getUserPosts = async (uploaderId) => {
  try {
    if (!uploaderId) {
      console.warn("Firebase: uploaderId é nulo ou indefinido para getUserPosts.");
      return [];
    }

    const ecgsCollectionRef = collection(db, 'ecgs');
    const q = query(
      ecgsCollectionRef,
      where('uploaderId', '==', uploaderId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const ecgsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const ecg = { id: docSnapshot.id, ...docSnapshot.data() };

      // Popula dados do criador (uploader)
      if (ecg.uploaderId) {
        try {
          const creatorProfileSnap = await getDoc(doc(db, 'users', ecg.uploaderId));
          if (creatorProfileSnap.exists()) {
            ecg.creator = creatorProfileSnap.data();
          } else {
            console.warn(`Perfil do criador ${ecg.uploaderId} não encontrado.`);
            ecg.creator = { username: 'Desconhecido', avatar: 'https://ui-avatars.com/api/?name=U' };
          }
        } catch (e) {
          console.error(`Erro ao buscar perfil do criador ${ecg.uploaderId}:`, e.message);
          ecg.creator = { username: 'Erro', avatar: 'https://ui-avatars.com/api/?name=E' };
        }
      }

      // Popula dados do médico laudador, se existir
      if (ecg.status === 'lauded' && ecg.laudationDoctorId) {
        try {
          const doctorProfileSnap = await getDoc(doc(db, 'users', ecg.laudationDoctorId));
          if (doctorProfileSnap.exists()) {
            ecg.laudationDoctor = doctorProfileSnap.data();
          } else {
            console.warn(`Perfil do médico laudador ${ecg.laudationDoctorId} não encontrado.`);
            ecg.laudationDoctor = { username: 'Médico Desconhecido', avatar: 'https://ui-avatars.com/api/?name=M' };
          }
        } catch (e) {
          console.error(`Erro ao buscar perfil do médico laudador ${ecg.laudationDoctorId}:`, e.message);
          ecg.laudationDoctor = { username: 'Erro Médico', avatar: 'https://ui-avatars.com/api/?name=ME' };
        }
      }

      // Adiciona o $createdAt e $id para compatibilidade com o EcgCard
      // FireStore Timestamps precisam ser convertidos para Date e depois para ISO string
      if (ecg.createdAt && ecg.createdAt.toDate) {
        ecg.$createdAt = ecg.createdAt.toDate().toISOString();
      } else {
        ecg.$createdAt = new Date().toISOString(); // Fallback se createdAt não for Firestore Timestamp
      }
      ecg.$id = docSnapshot.id; // Adiciona o ID do documento como $id para compatibilidade

      return ecg;
    }));

    console.log('Firebase: ECGs do usuário buscados:', ecgsData.length);
    return ecgsData;
  } catch (error) {
    console.error('Firebase: Erro ao buscar posts do usuário:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Busca todos os ECGs laudados por um médico específico do Cloud Firestore.
 * @param {string} doctorId O UID do médico que laudou.
 * @returns {Array<object>} Lista de documentos de ECG laudados.
 */
export const getLaudedEcgsByDoctorId = async (doctorId) => {
  try {
    if (!doctorId) {
      console.warn("Firebase: doctorId é nulo ou indefinido para getLaudedEcgsByDoctorId.");
      return [];
    }

    const ecgsCollectionRef = collection(db, 'ecgs');
    const q = query(
      ecgsCollectionRef,
      where('laudationDoctorId', '==', doctorId),
      where('status', '==', 'lauded'), // Certifica-se de buscar apenas laudados
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const ecgsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const ecg = { id: docSnapshot.id, ...docSnapshot.data() };

      // Popula dados do criador (uploader)
      if (ecg.uploaderId) {
        try {
          const creatorProfileSnap = await getDoc(doc(db, 'users', ecg.uploaderId));
          if (creatorProfileSnap.exists()) {
            ecg.creator = creatorProfileSnap.data();
          } else {
            console.warn(`Perfil do criador ${ecg.uploaderId} não encontrado.`);
            ecg.creator = { username: 'Desconhecido', avatar: 'https://ui-avatars.com/api/?name=U' };
          }
        } catch (e) {
          console.error(`Erro ao buscar perfil do criador ${ecg.uploaderId}:`, e.message);
          ecg.creator = { username: 'Erro', avatar: 'https://ui-avatars.com/api/?name=E' };
        }
      }

      // Popula dados do médico laudador (ele mesmo, ou de outro médico se a lógica exigir)
      // Mas para 'getLaudedEcgsByDoctorId', o laudationDoctor é o próprio `doctorId`
      if (ecg.laudationDoctorId) {
        try {
          const doctorProfileSnap = await getDoc(doc(db, 'users', ecg.laudationDoctorId));
          if (doctorProfileSnap.exists()) {
            ecg.laudationDoctor = doctorProfileSnap.data();
          } else {
            console.warn(`Perfil do médico laudador ${ecg.laudationDoctorId} não encontrado.`);
            ecg.laudationDoctor = { username: 'Médico Desconhecido', avatar: 'https://ui-avatars.com/api/?name=M' };
          }
        } catch (e) {
          console.error(`Erro ao buscar perfil do médico laudador ${ecg.laudationDoctorId}:`, e.message);
          ecg.laudationDoctor = { username: 'Erro Médico', avatar: 'https://ui-avatars.com/api/?name=ME' };
        }
      }

      // Adiciona o $createdAt e $id para compatibilidade com o EcgCard
      if (ecg.createdAt && ecg.createdAt.toDate) {
        ecg.$createdAt = ecg.createdAt.toDate().toISOString();
      } else {
        ecg.$createdAt = new Date().toISOString(); // Fallback
      }
      ecg.$id = docSnapshot.id; // Adiciona o ID como $id para compatibilidade

      return ecg;
    }));

    console.log('Firebase: ECGs laudados pelo médico buscados:', ecgsData.length);
    return ecgsData;
  } catch (error) {
    console.error('Firebase: Erro ao buscar ECGs laudados pelo médico:', error.message);
    throw new Error(error.message);
  }
};


/**
 * Busca ECGs com status 'pending' e opcionalmente por prioridade do Cloud Firestore.
 * @param {string|null} priority O tipo de prioridade ('Urgente', 'Eletivo') ou null para todos.
 * @returns {Array<object>} Lista de documentos de ECG pendentes.
 */
export const getPendingEcgs = async (priority = null) => {
  try {
    const ecgsCollectionRef = collection(db, 'ecgs');
    let q = query(ecgsCollectionRef, where('status', '==', 'pending'));

    if (priority) {
      q = query(q, where('priority', '==', priority));
    }
    q = query(q, orderBy('createdAt', 'desc')); // Adiciona orderBy

    const querySnapshot = await getDocs(q);
    
    const ecgsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const ecg = { id: docSnapshot.id, ...docSnapshot.data() };

      // Popula dados do criador (uploader)
      if (ecg.uploaderId) {
        try {
          const creatorProfileSnap = await getDoc(doc(db, 'users', ecg.uploaderId));
          if (creatorProfileSnap.exists()) {
            ecg.creator = creatorProfileSnap.data();
          } else {
            console.warn(`Perfil do criador ${ecg.uploaderId} não encontrado.`);
            ecg.creator = { username: 'Desconhecido', avatar: 'https://ui-avatars.com/api/?name=U' };
          }
        } catch (e) {
          console.error(`Erro ao buscar perfil do criador ${ecg.uploaderId}:`, e.message);
          ecg.creator = { username: 'Erro', avatar: 'https://ui-avatars.com/api/?name=E' };
        }
      }

      if (ecg.createdAt && ecg.createdAt.toDate) {
        ecg.$createdAt = ecg.createdAt.toDate().toISOString();
      } else {
        ecg.$createdAt = new Date().toISOString(); // Fallback
      }
      ecg.$id = docSnapshot.id; // Adiciona o ID como $id para compatibilidade

      return ecg;
    }));

    console.log(`Firebase: ECGs pendentes (prioridade: ${priority}) buscados:`, ecgsData.length);
    return ecgsData;
  } catch (error) {
    console.error(`Firebase: Erro ao buscar ECGs pendentes (prioridade: ${priority}):`, error.message);
    throw new Error(error.message);
  }
};

/**
 * Atualiza um documento de ECG com os dados do laudo no Cloud Firestore.
 * @param {string} ecgId O ID do documento do ECG a ser atualizado.
 * @param {string} laudationContent O conteúdo do laudo (texto livre).
 * @param {string} laudationDoctorId O UID do médico que laudou.
 * @param {object} laudationDetails Detalhes estruturados do laudo.
 * @returns {string} O ID do documento do ECG laudado.
 */
export const updateEcgLaudation = async (ecgId, laudationContent, laudationDoctorId, laudationDetails) => {
  try {
    const ecgDocRef = doc(db, 'ecgs', ecgId); // Referência ao documento do ECG
    await updateDoc(ecgDocRef, {
      status: 'lauded', // Altera o status para 'laudado'
      laudationContent: laudationContent, // Conteúdo do laudo (texto livre)
      laudationDoctorId: laudationDoctorId, // ID do médico que laudou
      laudationDetails: JSON.stringify(laudationDetails), // Detalhes estruturados do laudo (em JSON string)
      laudedAt: serverTimestamp(), // Carimbo de data/hora do laudo
    });
    console.log("Firebase: ECG atualizado com laudo:", ecgId);
    return ecgId; // Retorna o ID do ECG laudado
  } catch (error) {
    console.error("Firebase: Erro ao atualizar ECG com laudo:", error.message);
    throw new Error(error.message);
  }
};

// Coleção para mensagens de chat (precisa existir no Firestore)
const MESSAGES_COLLECTION = 'messages'; 

/**
 * Busca mensagens de um ECG específico no Cloud Firestore.
 * @param {string} ecgId O ID do ECG.
 * @returns {Array<object>} Lista de mensagens do chat.
 */
export const getEcgMessages = async (ecgId) => {
  try {
    const messagesCollectionRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesCollectionRef,
      where('ecgId', '==', ecgId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const messagesData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const message = { id: docSnapshot.id, ...docSnapshot.data() };
      // Popula dados do remetente
      if (message.senderId) {
        try {
          const senderProfileSnap = await getDoc(doc(db, 'users', message.senderId));
          if (senderProfileSnap.exists()) {
            message.sender = senderProfileSnap.data();
          } else {
            console.warn(`Perfil do remetente ${message.senderId} não encontrado.`);
            message.sender = { username: 'Desconhecido', avatar: `https://ui-avatars.com/api/?name=U` };
          }
        } catch (e) {
          console.error(`Erro ao buscar perfil do remetente ${message.senderId}:`, e.message);
          message.sender = { username: 'Erro', avatar: `https://ui-avatars.com/api/?name=E` };
        }
      }

      // Compatibilidade com $id e $createdAt para Appwrite
      if (message.createdAt && message.createdAt.toDate) {
        message.$createdAt = message.createdAt.toDate().toISOString();
      } else {
        message.$createdAt = new Date().toISOString(); // Fallback
      }
      message.$id = docSnapshot.id;
      return message;
    }));
    return messagesData;
  } catch (error) {
    console.error('Firebase: Erro ao buscar mensagens do ECG:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Envia uma nova mensagem para um ECG no Cloud Firestore.
 * @param {string} ecgId O ID do ECG.
 * @param {string} senderId O UID do remetente.
 * @param {string} message O conteúdo da mensagem.
 * @returns {string} O ID da mensagem criada.
 */
export const sendEcgMessage = async (ecgId, senderId, message) => {
  try {
    const messagesCollectionRef = collection(db, MESSAGES_COLLECTION);
    const newMessageRef = await addDoc(messagesCollectionRef, {
      ecgId,
      senderId,
      message,
      createdAt: serverTimestamp(),
    });
    console.log('Firebase: Mensagem enviada com ID:', newMessageRef.id);
    return newMessageRef.id;
  } catch (error) {
    console.error('Firebase: Erro ao enviar mensagem do ECG:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Subscreve a atualizações em tempo real das mensagens de um ECG no Cloud Firestore.
 * @param {string} ecgId O ID do ECG.
 * @param {function} callback Função de callback para cada nova mensagem.
 * @returns {function} Uma função para cancelar a subscrição.
 */
export const subscribeToEcgMessages = (ecgId, callback) => {
  const messagesCollectionRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesCollectionRef,
    where('ecgId', '==', ecgId),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    // Filtra apenas as mudanças de adição de documento
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const newMsg = { id: change.doc.id, ...change.doc.data() };
        // Popula o remetente da nova mensagem antes de chamar o callback
        if (newMsg.senderId) {
          try {
            const senderProfileSnap = await getDoc(doc(db, 'users', newMsg.senderId));
            if (senderProfileSnap.exists()) {
              newMsg.sender = senderProfileSnap.data();
            } else {
              console.warn(`Perfil do remetente ${newMsg.senderId} não encontrado.`);
              newMsg.sender = { username: 'Desconhecido', avatar: `https://ui-avatars.com/api/?name=U` };
            }
          } catch (e) {
            console.error(`Erro ao buscar perfil do remetente (realtime) ${newMsg.senderId}:`, e.message);
            newMsg.sender = { username: 'Erro', avatar: `https://ui-avatars.com/api/?name=E` };
          }
        }
        // Compatibilidade com $id e $createdAt para Appwrite
        if (newMsg.createdAt && newMsg.createdAt.toDate) {
            newMsg.$createdAt = newMsg.createdAt.toDate().toISOString();
        } else {
            newMsg.$createdAt = new Date().toISOString(); // Fallback
        }
        newMsg.$id = change.doc.id;
        callback(newMsg);
      }
    });
  }, (error) => {
    console.error("Firebase: Erro na subscrição de mensagens em tempo real:", error);
  });

  return unsubscribe;
};

// Remover estas funções que não são mais necessárias ou serão substituídas
// export const getAllPosts = async () => { /* ... */ };
// export const getLatestPosts = async () => { /* ... */ };
// export const searchPosts = async (query) => { /* ... */ };
// export const getUserProfile = async (userId) => { /* ... */ };
