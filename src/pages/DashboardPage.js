import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDocuments, addDocument, updateDocument, deleteDocument,
  getFolders, addFolder,
} from '../services/indexedDbService';

const DashboardPage = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeFolderId, setActiveFolderId] = useState(null);


  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          // Fallback, should ideally be handled by App.js state
        } else {
          navigate('/login');
          return;
        }
      }

      const docs = await getDocuments();
      setDocuments(docs);
      const flds = await getFolders();
      setFolders(flds);
    };
    fetchInitialData();
  }, [navigate, currentUser]);

  const refreshDocumentsAndFolders = async () => {
    const docs = await getDocuments();
    setDocuments(docs);
    const flds = await getFolders();
    setFolders(flds);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result;
        const newDoc = {
          name: file.name,
          size: file.size,
          type: file.type,
          content: fileContent,
          favorite: false,
          folderId: activeFolderId,
        };
        try {
          await addDocument(newDoc);
          refreshDocumentsAndFolders();
        } catch (error) {
          console.error("Gagal menambahkan dokumen:", error);
          alert("Gagal menambahkan dokumen.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleFavorite = async (docId, currentFavoriteStatus) => {
    try {
      await updateDocument(docId, { favorite: !currentFavoriteStatus });
      refreshDocumentsAndFolders();
    } catch (error) {
      console.error("Gagal mengubah status favorit:", error);
      alert("Gagal mengubah status favorit.");
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        await deleteDocument(docId);
        refreshDocumentsAndFolders();
      } catch (error) {
        console.error("Gagal menghapus dokumen:", error);
        alert("Gagal menghapus dokumen.");
      }
    }
  };

  const handleAddFolderSubmit = async (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      try {
        await addFolder(newFolderName.trim());
        setNewFolderName('');
        setShowAddFolderModal(false);
        refreshDocumentsAndFolders();
      } catch (error) {
        console.error("Gagal menambahkan folder:", error);
        alert("Gagal menambahkan folder.");
      }
    }
  };


  const filteredAndSortedDocuments = documents
    .filter(doc => {
      if (activeFolderId && doc.folderId !== activeFolderId) {
        return false;
      }
      return true;
    })
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        activeFilter === 'Semua' ||
        (activeFilter === 'Favorit' && doc.favorite) ||
        activeFilter === 'Terbaru'; // <--- PERBAIKAN DI SINI: Termasuk 'Terbaru' di filter
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (activeFilter === 'Terbaru') {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

  const getDocIcon = (docType) => {
    if (docType.includes('image')) return (
      <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L20 20m-6-6l-2-2m2-2l2-2"></path>
      </svg>
    );
    if (docType.includes('pdf')) return (
      <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 4h7v4h4v10H6V4zm2 12h8v2H8v-2zm0-4h8v2H8v-2z"></path>
      </svg>
    );
    if (docType.includes('word') || docType.includes('officedocument.wordprocessingml')) return (
      <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 4h-9L7.05 6.95 10 10l-2 2-3.05-3.05L4 10v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2zM6 6.95L8.95 4H18v2H6.95L6 6.95zM18 19V8h-8v11H6V8h-.05L4 9.95V19a2 2 0 002 2h12a2 2 0 002-2z"></path>
      </svg>
    );
    if (docType.includes('excel') || docType.includes('spreadsheetml')) return (
      <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM5 5h14v2H5V5zm0 4h14v2H5V9zm0 4h14v2H5v-2zm0 4h14v2H5v-2z"></path>
      </svg>
    );
    return (
      <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
      </svg>
    );
  };


  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 shadow-lg flex flex-col p-4 text-gray-200">
        <div className="text-2xl font-bold text-indigo-400 mb-6">Archira</div>
        <div className="relative mb-4">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded w-full flex items-center justify-center">
            <span className="mr-2">+</span> Dokumen Baru
          </button>
          <input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
        </div>

        <nav className="flex-grow">
          <ul>
            <li className="mb-2">
              <button
                className={`flex items-center p-2 rounded-md hover:bg-gray-700 w-full text-left ${activeFilter === 'Semua' && activeFolderId === null ? 'bg-gray-700 font-semibold' : ''}`}
                onClick={() => { setActiveFilter('Semua'); setActiveFolderId(null); }}
              >
                <span className="mr-2">🏠</span> Dashboard
              </button>
            </li>
            <li className="mb-2">
              <button
                className={`flex items-center p-2 rounded-md hover:bg-gray-700 w-full text-left ${activeFilter === 'Favorit' ? 'bg-gray-700 font-semibold' : ''}`}
                onClick={() => { setActiveFilter('Favorit'); setActiveFolderId(null); }}
              >
                <span className="mr-2">⭐</span> Favorit
              </button>
            </li>
            <li className="mb-2">
              <button
                className={`flex items-center p-2 rounded-md hover:bg-gray-700 w-full text-left ${activeFilter === 'Terbaru' ? 'bg-gray-700 font-semibold' : ''}`}
                onClick={() => { setActiveFilter('Terbaru'); setActiveFolderId(null); }}
              >
                <span className="mr-2">⏳</span> Terbaru
              </button>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <h3 className="text-xs uppercase text-gray-400 mb-2 flex items-center justify-between">
              FOLDER
              <button onClick={() => setShowAddFolderModal(true)} className="text-gray-400 hover:text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </h3>
            <ul>
              {folders.map(folder => (
                <li key={folder.id} className="mb-1">
                  <button
                    className={`flex items-center p-2 rounded-md text-sm hover:bg-gray-700 w-full text-left ${activeFolderId === folder.id ? 'bg-gray-700 font-semibold' : ''}`}
                    onClick={() => { setActiveFilter('Semua'); setActiveFolderId(folder.id); }}
                  >
                    <span className="mr-2">📁</span> {folder.name}
                  </button>
                </li>
              ))}
              {folders.length === 0 && (
                <li className="mb-1">
                  <span className="flex items-center p-2 text-gray-500 text-sm italic">
                    Belum ada folder.
                  </span>
                </li>
              )}
            </ul>
          </div>
        </nav>

        {/* Bagian Profil Pengguna - hanya menampilkan, tanpa edit */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center p-2">
            <img src={currentUser?.photo || 'https://placehold.co/40x40/cccccc/ffffff?text=User'} alt="User Avatar" className="w-10 h-10 rounded-full mr-3 object-cover" />
            <div>
              <div className="font-semibold text-gray-100">{currentUser?.name || currentUser?.email.split('@')[0] || 'Pengguna'}</div>
              <div className="text-sm text-gray-400">{currentUser?.email || 'N/A'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden bg-gray-900 bg-opacity-70 rounded-tl-lg">
        {/* Navbar / Search Bar */}
        <header className="flex items-center justify-between bg-gray-800 p-4 rounded-lg shadow-md mb-6 text-gray-100">
          <div className="flex items-center flex-grow">
            <h1 className="text-2xl font-semibold mr-4">Dashboard</h1>
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Cari dokumen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-700 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
            </div>
          </div>
          {/* Tombol Logout dipindahkan ke sini */}
          <div className="flex items-center space-x-4 ml-4">
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-5V8m4 0H7a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2z"></path></svg>
              Logout
            </button>
          </div>
        </header>

        {/* Filters and Document Display */}
        <div className="flex items-center mb-4 space-x-4 text-gray-100">
          <button
            className={`px-4 py-2 rounded-lg ${activeFilter === 'Semua' && activeFolderId === null ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => { setActiveFilter('Semua'); setActiveFolderId(null); }}
          >
            Semua
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeFilter === 'Terbaru' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => setActiveFilter('Terbaru')}
          >
            Terbaru
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeFilter === 'Favorit' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => setActiveFilter('Favorit')}
          >
            Favorit
          </button>
        </div>

        {/* Document Grid */}
        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
          {filteredAndSortedDocuments.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">
              Tidak ada dokumen. Unggah dokumen pertama Anda!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAndSortedDocuments.map((doc) => (
                <div key={doc.id} className="bg-gray-800 rounded-lg shadow-md p-4 flex flex-col items-center text-center relative hover:shadow-lg transition-shadow duration-200">
                  <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                    {doc.type.startsWith('image/') ? (
                      <img src={doc.content} alt={doc.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      getDocIcon(doc.type)
                    )}
                  </div>
                  <h3 className="text-md font-semibold text-gray-100 break-words w-full">{doc.name}</h3>
                  <p className="text-sm text-gray-400">{`${(doc.size / (1024 * 1024)).toFixed(2)} MB`}</p>
                  <p className="text-xs text-gray-500">{doc.date}</p>

                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => handleToggleFavorite(doc.id, doc.favorite)}
                      className="p-1 rounded-full bg-gray-700 bg-opacity-70 text-yellow-400 hover:text-yellow-300"
                      title={doc.favorite ? "Hapus dari Favorit" : "Tambahkan ke Favorit"}
                    >
                      {doc.favorite ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.721c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.721c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1 rounded-full bg-gray-700 bg-opacity-70 text-red-400 hover:text-red-300"
                      title="Hapus Dokumen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Tambah Folder (tetap ada) */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96 text-gray-100">
            <h2 className="text-xl font-semibold mb-4">Tambah Folder Baru</h2>
            <form onSubmit={handleAddFolderSubmit}>
              <input
                type="text"
                className="w-full p-2 border border-gray-700 bg-gray-700 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
                placeholder="Nama Folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowAddFolderModal(false); setNewFolderName(''); }}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profil Pengguna - DIHAPUS */}
      {/* Kode modal profil yang sebelumnya ada di sini telah dihapus */}
    </div>
  );
};

export default DashboardPage;
