import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };
  
  // In a real app, you would have a separate signup flow.
  // For this project, we assume the user exists.
  // Example test user: test@example.com / password

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-center text-teal-800">Bem-vinda, Dona Cyca</h1>
        <p className="text-center text-xl text-gray-600">Por favor, entre para acessar seu Guardião.</p>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="text-lg font-medium text-gray-700">Email</label>
            <input
              id="email"
              className="w-full px-4 py-3 mt-1 text-lg border-2 border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              type="email"
              placeholder="seu@email.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-lg font-medium text-gray-700">Senha</label>
            <input
              id="password"
              className="w-full px-4 py-3 mt-1 text-lg border-2 border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              type="password"
              placeholder="Sua senha"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button type="submit" className="w-full py-4 text-2xl font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:bg-gray-400" disabled={loading}>
              {loading ? <span>Entrando...</span> : <span>Entrar</span>}
            </button>
          </div>
          {error && <p className="text-center text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Auth;
