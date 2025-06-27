import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser, registerUser } from '../services/indexedDbService';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = await authenticateUser(email, password);
      if (user) {
        onLoginSuccess(user);
        navigate('/dashboard');
      } else {
        setError('Email atau kata sandi salah.');
      }
    } else {
      const success = await registerUser(email, password);
      if (success) {
        alert('Registrasi berhasil! Silakan login.');
        setIsLogin(true); // Kembali ke form login
        setEmail('');
        setPassword('');
      } else {
        setError('Registrasi gagal. Email mungkin sudah terdaftar.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-indigo-600 mb-4">Archira</div> {/* Nama aplikasi diubah di sini */}
          <h2 className="text-2xl font-semibold text-gray-800">
            {isLogin ? 'Selamat Datang Kembali' : 'Daftar Akun Baru'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'Silakan masuk ke akun Anda' : 'Buat akun Anda untuk mulai mengelola dokumen'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Kata Sandi
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

          {/* Fitur "Ingat saya" dan "Lupa kata sandi?" dihapus */}
          {/*
          <div className="flex items-center justify-between mb-6">
            {isLogin && (
              <>
                <label className="flex items-center text-gray-600">
                  <input type="checkbox" className="mr-2" /> Ingat saya
                </label>
                <a href="#" className="inline-block align-baseline font-bold text-sm text-indigo-500 hover:text-indigo-800">
                  Lupa kata sandi?
                </a>
              </>
            )}
          </div>
          */}

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            {isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-indigo-500 hover:text-indigo-800"
          >
            {isLogin ? 'Daftar Sekarang' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
