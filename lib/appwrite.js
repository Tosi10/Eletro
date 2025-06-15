import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";
import { images } from '../constants/index.js'; // CAMINHO ATUALIZADO PARA SER MAIS EXPLÍCITO

export const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  platform: 'com.tosi.aora',
  projectId: "67e318fb00338bb32166",
  databaseId: '67e31cf2000c9c311179',
  userCollectionId: '67e31d660002d2000d01',
  ecgCollectionId: '6848373b000a96de02f6', // <<< ATENÇÃO: VERIFIQUE/COLOQUE O ID CERTO DA SUA COLEÇÃO DE ECG AQUI!
  storageId: '67e32029003719871551',
};

const {
  endpoint,
  projectId,
  platform,
  databaseId,
  userCollectionId,
  ecgCollectionId,
  storageId,
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

// Função para obter o usuário atual
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

// Registrar usuário
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
      newAccount.$id, // Usa o ID da conta como ID do documento de perfil
      {
        accountId: newAccount.$id, // Atributo accountId também com o ID da conta
        email: email,
        username: username,
        avatar: avatarUrl,
        role: 'enfermeiro', // Define o role padrão para novos usuários como 'enfermeiro'
      }
    );

    return newUser;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw new Error(error.message);
  }
}

// Fazer login
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
    console.log('Nova sessão criada com sucesso:', session);
    return session;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw new Error(error.message);
  }
}

export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(databaseId, ecgCollectionId);
    return posts.documents;
  } catch (error) {
    console.error("Erro ao buscar todos os posts:", error);
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
    console.log("getLatestPosts:", posts.documents);
    return posts.documents;
  } catch (error) {
    console.error("Erro ao buscar os últimos posts:", error);
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
    console.error("Erro ao buscar posts:", error);
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

    const postsWithCreator = await Promise.all(posts.documents.map(async (post) => {
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
            console.warn(`Perfil do uploader com ID ${post.uploaderId} não encontrado.`);
            post.creator = { username: 'Unknown', avatar: images.profile };
          }
        } catch (profileError) {
          console.error(`Erro ao buscar perfil do uploader ${post.uploaderId}:`, profileError);
          post.creator = { username: 'Erro', avatar: images.profile };
        }
      } else {
        post.creator = { username: 'N/A', avatar: images.profile };
      }
      return post;
    }));

    return postsWithCreator;
  } catch (error) {
    console.error("Erro ao buscar posts do usuário:", error);
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
    console.error("Erro ao buscar perfil do usuário:", error);
    throw new Error(error.message);
  }
};

export const signOut = async () => {
  try {
    const session = await account.deleteSession('current');
    return session;
  } catch (error) {
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
    throw new Error(error);
  }
}

// Função para upload de arquivo (imagem)
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
    throw new Error(error);
  }
};

// Função para criar ECG
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
        status: 'pending', // Status inicial: pendente de laudo
        notes,
        uploaderId,
      }
    );

    return newEcgDocument;
  } catch (error) {
    console.error('Erro ao criar ECG:', error);
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
    console.error('Erro ao garantir perfil do usuário:', error);
    throw error;
  }
}

// >>> NOVAS FUNÇÕES PARA O LAUDO <<<

// Função para buscar ECGs com status 'pending' e opcionalmente por prioridade
export const getPendingEcgs = async (priority = null) => {
  try {
    const queries = [Query.equal('status', 'pending'), Query.orderDesc('$createdAt')];
    if (priority) {
      queries.push(Query.equal('priority', priority));
    }

    const pendingEcgs = await databases.listDocuments(
      databaseId,
      ecgCollectionId,
      queries // Passa as queries construídas
    );
    console.log(`getPendingEcgs (priority: ${priority}):`, pendingEcgs.documents);
    return pendingEcgs.documents;
  } catch (error) {
    console.error(`Erro ao buscar ECGs pendentes (priority: ${priority}):`, error);
    throw new Error(error.message);
  }
};

// Função para atualizar um ECG com os dados do laudo
export const updateEcgLaudation = async (ecgId, laudationContent, laudationDoctorId, laudationDetails) => {
  try {
    const updatedEcg = await databases.updateDocument(
      databaseId,
      ecgCollectionId,
      ecgId,
      {
        status: 'lauded', // Altera o status para 'laudado'
        laudationContent: laudationContent, // Conteúdo do laudo (texto livre)
        laudationDoctorId: laudationDoctorId, // ID do médico que laudou
        laudationDetails: JSON.stringify(laudationDetails), // Detalhes estruturados do laudo (em JSON string)
      }
    );
    console.log("ECG atualizado com laudo:", updatedEcg);
    return updatedEcg;
  } catch (error) {
    console.error("Erro ao atualizar ECG com laudo:", error);
    throw new Error(error.message);
  }
};
