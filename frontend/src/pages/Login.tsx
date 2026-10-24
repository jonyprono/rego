import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail01Icon, LockPasswordIcon, ArrowRight01Icon, Alert01Icon, CheckmarkCircle02Icon } from 'hugeicons-react';
import { X } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
      console.error('=== LOGIN ERROR ===', err);
      const serverMsg = err.response?.data?.message;
      if (!err.response) {
        setError(`Serveur injoignable. Vérifiez la connexion au serveur.`);
      } else {
        // Message générique sécurisé pour empêcher les attaques par énumération
        setError(serverMsg || "Nom d'utilisateur ou mot de passe incorrect.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword !== confirmNewPassword) {
      setForgotError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email: forgotEmail,
        newPassword
      });

      setForgotSuccess(response.data.message || 'Votre mot de passe a bien été mis à jour.');
      setEmail(forgotEmail);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setSuccessMsg('Votre mot de passe a été modifié. Vous pouvez vous connecter.');
      }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-primary-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      <div className="w-full max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden relative">
          
          <div className="px-6 sm:px-10 pt-10 sm:pt-12 pb-6 sm:pb-8 text-center relative z-10">
            <div className="flex justify-center mb-6">
              <img src="/logo rego.jpg" alt="Logo Rego" className="h-16 sm:h-20 object-contain drop-shadow-sm" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900 tracking-tight">Bienvenue</h2>
            <p className="text-secondary-600 mt-2 sm:mt-3 font-medium text-sm">Connectez-vous pour accéder à vos rapports d'intervention.</p>
          </div>

          <div className="px-6 sm:px-10 pb-8 sm:pb-10 relative z-10">
            {error && (
              <div className="flex items-center bg-red-50 text-red-700 p-4 rounded-xl mb-6 sm:mb-8 text-sm font-medium border border-red-200">
                <div className="mr-3 bg-red-200/50 p-1 rounded-full flex-shrink-0 text-red-700"><Alert01Icon size={16} /></div>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center bg-emerald-50 text-emerald-800 p-4 rounded-xl mb-6 sm:mb-8 text-sm font-medium border border-emerald-200">
                <div className="mr-3 bg-emerald-200/50 p-1 rounded-full flex-shrink-0 text-emerald-700"><CheckmarkCircle02Icon size={16} /></div>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-secondary-800">Adresse Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                    <Mail01Icon size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                    placeholder="technicien@entreprise.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-secondary-800">Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotError('');
                      setForgotSuccess('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
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
                    className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 sm:mt-8 flex justify-center items-center py-3.5 sm:py-4 px-4 rounded-xl shadow-[0_8px_20px_rgba(198,40,40,0.3)] text-sm font-display font-bold text-white bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
                {!isLoading && <ArrowRight01Icon size={18} className="ml-2 group-hover:translate-x-1 transition-transform stroke-[2.5]" />}
              </button>
            </form>
          </div>

          <div className="px-6 sm:px-10 py-5 sm:py-6 bg-white/40 backdrop-blur-md border-t border-white/60 text-center relative z-10">
            <p className="text-sm font-medium text-secondary-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
                Inscrivez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALE DE RÉINITIALISATION DE MOT DE PASSE OUBLIÉ */}
      {/* ======================================================== */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mot de passe oublié</h3>
                <p className="text-xs text-gray-500 mt-0.5">Définissez un nouveau mot de passe pour votre compte.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div className="flex items-center bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-xs font-medium border border-red-200">
                <Alert01Icon size={16} className="mr-2 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="flex items-center bg-emerald-50 text-emerald-800 p-3 rounded-xl mb-4 text-xs font-medium border border-emerald-200">
                <CheckmarkCircle02Icon size={16} className="mr-2 flex-shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Votre adresse email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  placeholder="votre-email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  placeholder="Minimum 6 caractères"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-xs transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isForgotLoading ? 'Mise à jour...' : 'Réinitialiser mon mot de passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
