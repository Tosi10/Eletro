import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";


export const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  platform: 'com.tosi.aora',
  projectId: '67e318fb00338bb32166',
  databaseId: '67e31cf2000c9c311179',
  userCollectionId: '67e31d660002d2000d01',
  videoCollectionId: '67e31dbe000e05cbd398',
  storageId: '67e32029003719871551',
};

const {
  endpoint,
  projectId,
  platform,
  databaseId,
  userCollectionId,
  videoCollectionId,
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
    const sessions = await account.listSessions();
    if (sessions.sessions.length === 0) {
      console.warn('Nenhuma sessão ativa encontrada. Usuário não autenticado.');
      return null;
    }

    const currentUser = await account.get();
    console.log('Usuário atual obtido:', currentUser);
    return currentUser;
  } catch (error) {
    console.error('Erro ao buscar o usuário atual:', error);
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
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
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
    const currentUser = await account.get();
    console.log('Usuário já está logado:', currentUser);

    await account.deleteSession('current');
    console.log('Sessão ativa encerrada.');

    const session = await account.createEmailSession(email, password);
    console.log('Nova sessão criada com sucesso:', session);
    return session;
  } catch (error) {
    if (error.code === 401) {
      const session = await account.createEmailSession(email, password);
      console.log('Sessão criada com sucesso:', session);
      return session;
    } else {
      console.error('Erro ao verificar ou criar sessão:', error);
      throw new Error(error.message);
    }
  }
}

export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(databaseId, videoCollectionId);
    [Query.orderDesc('$createdAt')]
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
      videoCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(7)]
    );
    console.log("getLatestPosts:", posts.documents); // Verifica os dados retornados
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
      videoCollectionId,
      [Query.search('title', query )]
    );
    console.log("getLatestPosts:", posts.documents); // Verifica os dados retornados
    return posts.documents;
  } catch (error) {
    console.error("Erro ao buscar os últimos posts:", error);
    throw new Error(error.message);
  }
};

export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.equal('creator', userId ), Query.orderDesc('$createdAt')]
    );
    console.log("getUserPosts:", posts.documents); // Verifica os dados retornados
    return posts.documents;
  } catch (error) {
    console.error("Erro ao buscar os últimos posts:", error);
    throw new Error(error.message);
  }
};

export const getUserProfile = async (accountId) => {
  try {
    const users = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal('accountId', accountId)]
    );
    return users.documents[0]; // Retorna o primeiro usuário encontrado
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
    if(type === 'video') {
      fileUrl = storage.getFileView(storageId, fileId)
    } else if(type ==='image'){
      fileUrl =storage.getFilePreview(storageId, fileId, 2000, 2000, 'top', 100)
    } else {
      throw new Error('Invalid file type');
    }

    if(!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
    
  }
}

export const uploadFile = async (file, type) => {
  if(!file) return;

  const { mimeType, ...rest } = file;
  const asset = {
     name: file.fileName,
     type: file.mimeType,
     size: file.fileSize,
     uri: file.uri,
   };

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    // Use getFileView para gerar a URL da thumbnail
    const fileUrl = storage.getFileView(storageId, uploadedFile.$id);

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
};

export const createVideo = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, 'image'),
      uploadFile(form.video, 'video'),
    ])

    const newPost = await databases.createDocument(
      databaseId, videoCollectionId, ID.unique(), {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId
      } 
    )

    return newPost;
  } catch (error) {
    
    throw new Error(error);
  }
}