// src/services/indexedDbService.js
import { openDB } from 'idb';

const DB_NAME = 'archievyDB';
// Penting: Versi database DITINGKATKAN karena properti 'name' dan 'photo' dikembalikan ke user object.
const DB_VERSION = 6; 

const USER_STORE = 'users';
const DOCUMENT_STORE = 'documents';
const FOLDER_STORE = 'folders';

/**
 * Menginisialisasi IndexedDB dan membuat/memperbarui object stores.
 * @returns {Promise<IDBDatabase>} Instance database.
 */
const initDb = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`DB upgrade needed from version ${oldVersion} to ${newVersion}`);

      // Pastikan store 'users' ada dan perbarui skema untuk nama dan foto
      if (!db.objectStoreNames.contains(USER_STORE)) {
        console.log(`Creating object store: ${USER_STORE}`);
        const userStore = db.createObjectStore(USER_STORE, { keyPath: 'id', autoIncrement: true });
        userStore.createIndex('email', 'email', { unique: true });
      } else if (oldVersion < 6) { // Jika upgrade dari versi < 6, pastikan properti name dan photo bisa ditambahkan
        console.log(`Updating object store: ${USER_STORE} - ensuring it can handle 'name' and 'photo' properties.`);
        // Pada IndexedDB, tidak perlu mengubah skema secara eksplisit untuk menambahkan properti baru pada objek yang sudah ada.
        // Cukup pastikan store ada.
      }

      // Pastikan store 'documents' ada dan perbarui indexes (hapus inTrash)
      if (!db.objectStoreNames.contains(DOCUMENT_STORE)) {
        console.log(`Creating object store: ${DOCUMENT_STORE}`);
        const documentStore = db.createObjectStore(DOCUMENT_STORE, { keyPath: 'id', autoIncrement: true });
        documentStore.createIndex('name', 'name', { unique: false });
        documentStore.createIndex('date', 'date', { unique: false });
        documentStore.createIndex('favorite', 'favorite', { unique: false });
        documentStore.createIndex('folderId', 'folderId', { unique: false, multiEntry: false });
      } else if (oldVersion < 4) { // Logic ini berjalan jika upgrade dari versi < 4 (ketika 'inTrash' masih ada)
        console.log(`Updating object store: ${DOCUMENT_STORE} - removing 'inTrash' index.`);
        const docStore = transaction.objectStore(DOCUMENT_STORE);
        if (docStore.indexNames.contains('inTrash')) {
          docStore.deleteIndex('inTrash');
        }
        if (!docStore.indexNames.contains('favorite')) docStore.createIndex('favorite', 'favorite', { unique: false });
        if (!docStore.indexNames.contains('folderId')) docStore.createIndex('folderId', 'folderId', { unique: false, multiEntry: false });
      }

      // Pastikan store 'folders' ada
      if (!db.objectStoreNames.contains(FOLDER_STORE)) {
        console.log(`Creating object store: ${FOLDER_STORE}`);
        db.createObjectStore(FOLDER_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
    blocked(currentVersion, blockedVersion, event) {
      console.warn('Database access blocked. Another tab might be using an older version or there\'s a pending upgrade:', event);
    },
    blocking() {
      console.warn('Database is blocking a new version from opening.');
    }
  });
  console.log('IndexedDB opened successfully.');
  return db;
};

// --- User Management ---
export const registerUser = async (email, password) => {
  const db = await initDb();
  const tx = db.transaction(USER_STORE, 'readwrite');
  const store = tx.objectStore(USER_STORE);

  try {
    const existingUser = await store.index('email').get(email);
    if (existingUser) {
      console.warn('Registrasi gagal: Email sudah terdaftar (dari IndexedDB).');
      await tx.done;
      return false;
    }
    // Tambah default 'name' dan 'photo' saat registrasi untuk tampilan
    await store.add({
      email,
      password,
      name: email.split('@')[0], // Nama default dari bagian email
      photo: 'https://placehold.co/40x40/cccccc/ffffff?text=User' // Foto profil default
    });
    await tx.done;
    console.log('User BERHASIL didaftarkan:', { email, password });
    return true;
  } catch (error) {
    console.error('Error saat mendaftarkan user:', error);
    return false;
  }
};

export const authenticateUser = async (email, password) => {
  const db = await initDb();
  const tx = db.transaction(USER_STORE, 'readonly');
  const store = tx.objectStore(USER_STORE);

  try {
    const user = await store.index('email').get(email);
    await tx.done;

    if (user && user.password === password) {
      console.log('User BERHASIL diautentikasi:', user.email);
      return user;
    }
    console.warn('Autentikasi GAGAL: Email atau kata sandi tidak cocok. User ditemukan:', !!user, 'Password cocok:', user && user.password === password);
    return null;
  } catch (error) {
    console.error('Error saat mengautentikasi user:', error);
    return null;
  }
};

// Fungsi updateUserProfile DIHAPUS

// --- Document Management ---

export const getDocuments = async () => {
  const db = await initDb();
  const tx = db.transaction(DOCUMENT_STORE, 'readonly');
  const store = tx.objectStore(DOCUMENT_STORE);
  try {
    const documents = await store.getAll();
    await tx.done;
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const addDocument = async (document) => {
  const db = await initDb();
  const tx = db.transaction(DOCUMENT_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENT_STORE);
  const newDoc = {
    ...document,
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    favorite: document.favorite || false,
    tag: document.tag || 'Umum',
    folderId: document.folderId || null,
  };
  try {
    await store.add(newDoc);
    await tx.done;
    return newDoc;
  }
  catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const getDocumentById = async (id) => {
  const db = await initDb();
  const tx = db.transaction(DOCUMENT_STORE, 'readonly');
  const store = tx.objectStore(DOCUMENT_STORE);
  try {
    const document = await store.get(id);
    await tx.done;
    return document;
  } catch (error) {
    console.error('Error getting document by ID:', id, error);
    return undefined;
  }
};

export const updateDocument = async (id, updates) => {
  const db = await initDb();
  const tx = db.transaction(DOCUMENT_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENT_STORE);
  try {
    const document = await store.get(id);
    if (!document) {
      await tx.done;
      return null;
    }
    const updatedDoc = { ...document, ...updates };
    await store.put(updatedDoc);
    await tx.done;
    console.log('Document updated successfully:', id, updates);
    return updatedDoc;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (id) => {
  const db = await initDb();
  const tx = db.transaction(DOCUMENT_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENT_STORE);
  try {
    await store.delete(id);
    await tx.done;
    console.log('Document permanently deleted:', id);
  } catch (error) {
    console.error('Error permanently deleting document:', error);
    throw error;
  }
};

// Fungsi recoverDocument dan permanentlyDeleteDocument dihapus

// --- Folder Management ---

export const getFolders = async () => {
  const db = await initDb();
  const tx = db.transaction(FOLDER_STORE, 'readonly');
  const store = tx.objectStore(FOLDER_STORE);
  try {
    const folders = await store.getAll();
    await tx.done;
    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
};

export const addFolder = async (folderName) => {
  const db = await initDb();
  const tx = db.transaction(FOLDER_STORE, 'readwrite');
  const store = tx.objectStore(FOLDER_STORE);
  const newFolder = {
    id: Date.now(),
    name: folderName,
    createdAt: new Date().toISOString().split('T')[0],
  };
  try {
    await store.add(newFolder);
    await tx.done;
    console.log('Folder added successfully:', newFolder.name);
    return newFolder;
  } catch (error) {
    console.error('Error adding folder:', error);
    throw error;
  }
};

export const deleteFolder = async (folderId) => {
  const db = await initDb();
  const tx = db.transaction(FOLDER_STORE, 'readwrite');
  const store = tx.objectStore(FOLDER_STORE);
  try {
    await store.delete(folderId);
    await tx.done;
    console.log('Folder deleted successfully:', folderId);
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};


export const clearAllStores = async () => {
  const db = await initDb();
  const tx = db.transaction([USER_STORE, DOCUMENT_STORE, FOLDER_STORE], 'readwrite');
  try {
    await tx.objectStore(USER_STORE).clear();
    await tx.objectStore(DOCUMENT_STORE).clear();
    await tx.objectStore(FOLDER_STORE).clear();
    await tx.done;
    console.log('All IndexedDB stores cleared.');
  } catch (error) {
    console.error('Error clearing all stores:', error);
    throw error;
  }
};
