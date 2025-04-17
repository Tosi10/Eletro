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
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}
