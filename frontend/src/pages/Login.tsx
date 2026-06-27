import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail01Icon, LockPasswordIcon, Login03Icon, ArrowRight01Icon } from 'hugeicons-react';
import axios from 'axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-primary-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      <div className="w-full max-w-md z-10 px-4 sm:px-0">
        <div className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          
          <div className="px-6 sm:px-10 pt-10 sm:pt-12 pb-6 sm:pb-8 text-center">
            <div className="flex justify-center mb-6">
              <img src="/logo rego.jpg" alt="Logo Rego" className="h-16 sm:h-20 object-contain" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900 tracking-tight">Bienvenue</h2>
            <p className="text-secondary-500 mt-2 sm:mt-3 font-sans text-sm">Connectez-vous pour accéder à vos rapports d'intervention.</p>
          </div>

          <div className="px-6 sm:px-10 pb-8 sm:pb-10">
            {error && (
              <div className="flex items-center bg-warning/10 text-warning p-4 rounded-xl mb-6 sm:mb-8 text-sm font-medium border border-warning/20">
                <div className="mr-3 bg-warning/20 p-1 rounded-full flex-shrink-0"><LockPasswordIcon size={16} /></div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-secondary-700">Adresse Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                    <Mail01Icon size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                    placeholder="technicien@entreprise.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-secondary-700">Mot de passe</label>
                  <a href="#" className="text-xs font-semibold text-primary-700 hover:text-primary-800">Oublié ?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                    <LockPasswordIcon size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 sm:mt-8 flex justify-center items-center py-3.5 sm:py-4 px-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(198,40,40,0.4)] text-sm font-display font-semibold text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
                {!isLoading && <ArrowRight01Icon size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>

          <div className="px-6 sm:px-10 py-5 sm:py-6 bg-gray-50/80 border-t border-gray-100 text-center">
            <p className="text-sm font-medium text-secondary-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
                Inscrivez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
