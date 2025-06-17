import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";
import { images } from '../constants/index.js';

// --- INÍCIO DO CÓDIGO PARA SUPRIMIR LOGS (OPCIONAL) ---
const originalConsoleLog = console.log;

console.log = (...args) => {
  // Verifique se a mensagem contém a string específica que você deseja filtrar
  if (typeof args[0] === 'string' && args[0].includes('realtime got disconnected')) {
    // Não faz nada, suprime o log
  } else {
    // Caso contrário, chama o console.log original
    originalConsoleLog(...args);
  }
};
// --- FIM DO CÓDIGO PARA SUPRIMIR LOGS ---

export const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  platform: 'com.tosi.aora',
  projectId: "67e318fb00338bb32166",
  databaseId: '67e31cf2000c9c311179',
  userCollectionId: '67e31d660002d2000d01',
  ecgCollectionId: '6848373b000a96de02f6',
  storageId: '67e32029003719871551',
  messagesCollectionId: 'messages', // ESTE DEVE SER 'messages' PARA SEU PROJETO
};

const {
  endpoint,
  projectId,
  platform,
  databaseId,
  userCollectionId,
  ecgCollectionId,
  storageId,
  messagesCollectionId,
} = config;

const client = new Client();

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);


export const getCurrentUser = async () => {
  try {
    const accountDetails = await account.get();
    console.log('Appwrite: Usuário logado obtido:', accountDetails);
    return accountDetails;
  } catch (error) {
    if (error.code === 401 && error.message.includes('missing scope(account)')) {
      console.warn('Appwrite: Nenhuma sessão ativa ou sessão expirada. Usuário não autenticado.');
      return null;
    }
    console.error('Appwrite: Erro inesperado ao buscar usuário atual:', error);
    throw error;
  }
};

export async function createUser(email, password, username) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      newAccount.$id,
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
        role: 'enfermeiro',
      }
    );

    return newUser;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw new Error(error.message);
  }
}

export async function signIn(email, password) {
  try {
    try {
      const currentSession = await account.getSession('current');
      if (currentSession) {
        console.log('Sessão ativa encontrada, encerrando para novo login.');
        await account.deleteSession('current');
      }
    } catch (sessionError) {
      if (sessionError.code !== 401) {
        console.warn('Erro ao verificar sessão existente:', sessionError);
      }
    }

    const session = await account.createEmailSession(email, password);
    originalConsoleLog('Nova sessão criada com sucesso:', session); // Use originalConsoleLog aqui
    return session;
  } catch (error) {
    originalConsoleLog('Erro ao fazer login:', error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
}

export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(databaseId, ecgCollectionId);
    return posts.documents;
  } catch (error) {
    originalConsoleLog("Erro ao buscar todos os posts:", error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      ecgCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(7)]
    );
    originalConsoleLog("getLatestPosts:", posts.documents); // Use originalConsoleLog aqui
    return posts.documents;
  } catch (error) {
    originalConsoleLog("Erro ao buscar os últimos posts:", error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const searchPosts = async (query) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      ecgCollectionId,
      [Query.search('title', query)]
    );
    return posts.documents;
  } catch (error) {
    originalConsoleLog("Erro ao buscar posts:", error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      ecgCollectionId,
      [Query.equal('uploaderId', userId), Query.orderDesc('$createdAt')]
    );

    const postsWithCreatorAndDoctor = await Promise.all(posts.documents.map(async (post) => {
      if (post.uploaderId) {
        try {
          const uploaderProfile = await databases.listDocuments(
            databaseId,
            userCollectionId,
            [Query.equal('$id', post.uploaderId)]
          );
          if (uploaderProfile.documents.length > 0) {
            post.creator = {
              username: uploaderProfile.documents[0].username,
              avatar: uploaderProfile.documents[0].avatar,
              $id: uploaderProfile.documents[0].$id,
              role: uploaderProfile.documents[0].role
            };
          } else {
            originalConsoleLog(`Perfil do uploader com ID ${post.uploaderId} não encontrado.`); // Use originalConsoleLog aqui
            post.creator = { username: 'Unknown', avatar: images.profile };
          }
        } catch (profileError) {
          originalConsoleLog(`Erro ao buscar perfil do uploader ${post.uploaderId}:`, profileError); // Use originalConsoleLog aqui
          post.creator = { username: 'Erro', avatar: images.profile };
        }
      } else {
        post.creator = { username: 'N/A', avatar: images.profile };
      }

      if (post.status === 'lauded' && post.laudationDoctorId) {
        try {
          const doctorProfile = await databases.listDocuments(
            databaseId,
            userCollectionId,
            [Query.equal('$id', post.laudationDoctorId)]
          );
          if (doctorProfile.documents.length > 0) {
            post.laudationDoctor = {
              username: doctorProfile.documents[0].username,
              avatar: doctorProfile.documents[0].avatar,
              $id: doctorProfile.documents[0].$id,
            };
          } else {
            originalConsoleLog(`Perfil do médico com ID ${post.laudationDoctorId} não encontrado.`); // Use originalConsoleLog aqui
            post.laudationDoctor = { username: 'Unknown Doctor', avatar: images.profile };
          }
        } catch (doctorProfileError) {
          originalConsoleLog(`Erro ao buscar perfil do médico ${post.laudationDoctorId}:`, doctorProfileError); // Use originalConsoleLog aqui
          post.laudationDoctor = { username: 'Erro', avatar: images.profile };
        }
      }
      return post;
    }));

    return postsWithCreatorAndDoctor;
  } catch (error) {
    originalConsoleLog("Erro ao buscar posts do usuário:", error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const users = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal('$id', userId)]
    );
    return users.documents[0];
  } catch (error) {
    originalConsoleLog("Erro ao buscar perfil do usuário:", error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const signOut = async () => {
  try {
    const session = await account.deleteSession('current');
    return session;
  } catch (error) {
    originalConsoleLog('Erro ao fazer logout:', error); // Use originalConsoleLog aqui
    throw new Error(error);
  }
};

export const getFilePreview = async (fileId, type) => {
  let fileUrl;

  try {
    if (type === 'image') {
      fileUrl = storage.getFilePreview(storageId, fileId, 2000, 2000, 'top', 100)
    } else {
      fileUrl = storage.getFileView(storageId, fileId)
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    originalConsoleLog('Erro ao obter preview do arquivo:', error); // Use originalConsoleLog aqui
    throw new Error(error);
  }
}

export const uploadFile = async (file, type) => {
  if (!file) return;

  const asset = {
    name: file.fileName || `ecg-${Date.now()}.jpg`,
    type: file.mimeType || 'image/jpeg',
    size: file.fileSize,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    const fileUrl = storage.getFileView(storageId, uploadedFile.$id);

    return fileUrl;
  } catch (error) {
    originalConsoleLog('Erro ao fazer upload do arquivo:', error); // Use originalConsoleLog aqui
    throw new Error(error);
  }
};

export async function createEcg({ patientName, age, sex, hasPacemaker, priority, ecgFile, notes, uploaderId }) {
  try {
    const imageUrl = await uploadFile(ecgFile, 'image');

    const newEcgDocument = await databases.createDocument(
      databaseId,
      ecgCollectionId,
      ID.unique(),
      {
        patientName,
        age: parseInt(age),
        sex,
        hasPacemaker,
        priority,
        imageUrl,
        status: 'pending',
        notes,
        uploaderId,
      }
    );

    return newEcgDocument;
  } catch (error) {
    originalConsoleLog('Erro ao criar ECG:', error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
}

export async function ensureUserProfile(user) {
  try {
    const result = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal('$id', user.$id)]
    );
    if (result.documents.length > 0) {
      return result.documents[0];
    }
    const avatarUrl = avatars.getInitials(user.username || user.email || 'U');
    const newProfile = await databases.createDocument(
      databaseId,
      userCollectionId,
      user.$id,
      {
        accountId: user.$id,
        email: user.email,
        username: user.username || user.email,
        avatar: avatarUrl,
        role: 'enfermeiro',
      }
    );
    return newProfile;
  } catch (error) {
    originalConsoleLog('Erro ao garantir perfil do usuário:', error); // Use originalConsoleLog aqui
    throw error;
  }
}

export const getPendingEcgs = async (priority = null) => {
  try {
    const queries = [Query.equal('status', 'pending'), Query.orderDesc('$createdAt')];
    if (priority) {
      queries.push(Query.equal('priority', priority));
    }

    const pendingEcgs = await databases.listDocuments(
      databaseId,
      ecgCollectionId,
      queries
    );
    originalConsoleLog(`getPendingEcgs (priority: ${priority}):`, pendingEcgs.documents); // Use originalConsoleLog aqui
    return pendingEcgs.documents;
  } catch (error) {
    originalConsoleLog(`Erro ao buscar ECGs pendentes (priority: ${priority}):`, error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const updateEcgLaudation = async (ecgId, laudationContent, laudationDoctorId, laudationDetails) => {
  try {
    const updatedEcg = await databases.updateDocument(
      databaseId,
      ecgCollectionId,
      ecgId,
      {
        status: 'lauded',
        laudationContent: laudationContent,
        laudationDoctorId: laudationDoctorId,
        laudationDetails: JSON.stringify(laudationDetails),
      }
    );
    originalConsoleLog("ECG atualizado com laudo:", updatedEcg); // Use originalConsoleLog aqui
    return updatedEcg;
  } catch (error) {
    originalConsoleLog("Erro ao atualizar ECG com laudo:", error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const getEcgById = async (ecgId) => {
  try {
    const ecgDocument = await databases.getDocument(databaseId, ecgCollectionId, ecgId);
    return ecgDocument;
  } catch (error) {
    originalConsoleLog(`Erro ao buscar ECG com ID ${ecgId}:`, error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const getEcgMessages = async (ecgId) => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      messagesCollectionId,
      [Query.equal('ecgId', ecgId), Query.orderAsc('$createdAt')]
    );
    const messagesWithSenderInfo = await Promise.all(response.documents.map(async (message) => {
      try {
        const senderProfile = await databases.listDocuments(
          databaseId,
          userCollectionId,
          [Query.equal('$id', message.senderId)]
        );
        if (senderProfile.documents.length > 0) {
          message.sender = {
            username: senderProfile.documents[0].username,
            avatar: senderProfile.documents[0].avatar,
            $id: senderProfile.documents[0].$id,
          };
        } else {
            originalConsoleLog(`Perfil do remetente ${message.senderId} não encontrado.`); // Use originalConsoleLog aqui
            message.sender = { username: 'Unknown', avatar: images.profile };
        }
      } catch (profileError) {
        originalConsoleLog(`Erro ao buscar perfil do remetente ${message.senderId}:`, profileError); // Use originalConsoleLog aqui
        message.sender = { username: 'Erro', avatar: images.profile };
      }
      return message;
    }));
    return messagesWithSenderInfo;
  } catch (error) {
    originalConsoleLog('Appwrite: Erro ao buscar mensagens do ECG:', error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const sendEcgMessage = async (ecgId, senderId, message) => {
  try {
    const newMessage = await databases.createDocument(
      databaseId,
      messagesCollectionId,
      ID.unique(),
      {
        ecgId,
        senderId,
        message,
      }
    );
    return newMessage;
  } catch (error) {
    originalConsoleLog('Appwrite: Erro ao enviar mensagem do ECG:', error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};

export const subscribeToEcgMessages = (ecgId, callback) => {
  const unsubscribe = client.subscribe(
    `databases.${config.databaseId}.collections.${config.messagesCollectionId}.documents`,
    (response) => {
      if (response.events.includes(`databases.*.collections.*.documents.*.create`) && response.payload.ecgId === ecgId) {
        getEcgMessages(ecgId).then(messages => {
             const newMessage = messages.find(msg => msg.$id === response.payload.$id);
             if (newMessage) {
                callback(newMessage);
             }
        }).catch(e => originalConsoleLog("Erro ao buscar nova mensagem realtime:", e)); // Use originalConsoleLog aqui
      }
    }
  );
  return unsubscribe;
};

export const getLaudedEcgsByDoctorId = async (doctorId) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      ecgCollectionId,
      [
        Query.equal('laudationDoctorId', doctorId),
        Query.equal('status', 'lauded'),
        Query.orderDesc('$createdAt')
      ]
    );

    const postsWithUploaderInfo = await Promise.all(posts.documents.map(async (post) => {
      if (post.uploaderId) {
        try {
          const uploaderProfile = await databases.listDocuments(
            databaseId,
            userCollectionId,
            [Query.equal('$id', post.uploaderId)]
          );
          if (uploaderProfile.documents.length > 0) {
            post.creator = {
              username: uploaderProfile.documents[0].username,
              avatar: uploaderProfile.documents[0].avatar,
              $id: uploaderProfile.documents[0].$id,
              role: uploaderProfile.documents[0].role
            };
          } else {
            originalConsoleLog(`Perfil do uploader com ID ${post.uploaderId} não encontrado para ECG laudado.`); // Use originalConsoleLog aqui
            post.creator = { username: 'Unknown Uploader', avatar: images.profile };
          }
        } catch (profileError) {
          originalConsoleLog(`Erro ao buscar perfil do uploader para ECG laudado ${post.uploaderId}:`, profileError); // Use originalConsoleLog aqui
          post.creator = { username: 'Erro', avatar: images.profile };
        }
      } else {
        post.creator = { username: 'N/A', avatar: images.profile };
      }
      post.laudationDoctor = {
        username: (await getUserProfile(doctorId))?.username || 'Você',
        avatar: (await getUserProfile(doctorId))?.avatar || images.profile,
        $id: doctorId,
      };
      return post;
    }));

    return postsWithUploaderInfo;
  } catch (error) {
    originalConsoleLog("Erro ao buscar ECGs laudados pelo médico:", error); // Use originalConsoleLog aqui
    throw new Error(error.message);
  }
};
