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
    storageId: '67e32029003719871551'
}
  
  const client = new Client();
  
  client
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setPlatform(config.platform);
  
  const account = new Account(client);
  const storage = new Storage(client);
  const avatars = new Avatars(client);
  const databases = new Databases(client);
  
  // Register user
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
      throw new Error(error);
    }
  }
  
  // Sign In
  export async function signIn(email, password) {
    try {
        // Verifica se já existe uma sessão ativa
        const currentUser = await account.get();
        console.log('Usuário já está logado:', currentUser);

        // Encerra a sessão ativa
        await account.deleteSession('current');
        console.log('Sessão ativa encerrada.');

        // Cria uma nova sessão
        const session = await account.createEmailSession(email, password);
        console.log('Nova sessão criada com sucesso:', session);
        return session;
    } catch (error) {
        // Se não houver sessão ativa, cria uma nova
        if (error.code === 401) { // Código 401 significa "não autorizado"
            const session = await account.createEmailSession(email, password);
            console.log('Sessão criada com sucesso:', session);
            return session;
        } else {
            console.error('Erro ao verificar ou criar sessão:', error);
            throw new Error(error.message);
        }
    }
}

 
  