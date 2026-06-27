import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserIcon, 
  Mail01Icon, 
  LockPasswordIcon, 
  SmartPhone01Icon, 
  AddTeamIcon, 
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Building04Icon,
  Alert01Icon
} from 'hugeicons-react';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.post(`${API_URL}/auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      {/* Background with subtle shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-primary-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      <div className="w-full max-w-2xl z-10 px-4 sm:px-0 py-8 sm:py-12">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden relative">
          
          <div className="px-6 sm:px-10 pt-10 sm:pt-12 pb-6 sm:pb-8 text-center relative z-10">
            <div className="flex justify-center mb-6">
              <img src="/logo rego.jpg" alt="Logo Rego" className="h-16 sm:h-20 object-contain drop-shadow-sm" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900 tracking-tight">Créer un compte</h2>
            <p className="text-secondary-600 mt-2 sm:mt-3 font-medium text-sm">Rejoignez-nous pour gérer vos rapports d'intervention simplement.</p>
          </div>

          <div className="px-6 sm:px-10 pb-8 sm:pb-10 relative z-10">
            {error && (
              <div className="flex items-center bg-warning/10 text-warning p-4 rounded-xl mb-6 sm:mb-8 text-sm font-medium border border-warning/20">
                <div className="mr-3 bg-warning/20 p-1 rounded-full flex-shrink-0"><Alert01Icon size={16} /></div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6 sm:space-y-8">
              
              {/* Informations Personnelles */}
              <div className="space-y-4 sm:space-y-5">
                <h3 className="text-base sm:text-lg font-bold text-secondary-900 border-b border-gray-100/50 pb-2">Informations personnelles</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-secondary-800">Prénom</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                        <UserIcon size={20} />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                        placeholder="Jean"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-secondary-800">Nom</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                        <UserIcon size={20} />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Entreprise */}
              <div className="space-y-4 sm:space-y-5">
                <h3 className="text-base sm:text-lg font-bold text-secondary-900 border-b border-gray-100/50 pb-2">Informations de l'entreprise</h3>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary-800">Nom de l'entreprise</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                      <Building04Icon size={20} />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                      placeholder="Ex: Entreprise de Maintenance SA"
                    />
                  </div>
                </div>
              </div>

              {/* Compte */}
              <div className="space-y-4 sm:space-y-5">
                <h3 className="text-base sm:text-lg font-bold text-secondary-900 border-b border-gray-100/50 pb-2">Informations de connexion</h3>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary-800">Adresse Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                      <Mail01Icon size={20} />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                      placeholder="technicien@entreprise.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-secondary-800">Mot de passe</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                        <LockPasswordIcon size={20} />
                      </div>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-secondary-800">Confirmer le mot de passe</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                        <LockPasswordIcon size={20} />
                      </div>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium rounded-xl shadow-inner"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 sm:mt-8 flex justify-center items-center py-3.5 sm:py-4 px-4 rounded-xl shadow-[0_8px_20px_rgba(198,40,40,0.3)] text-sm font-display font-bold text-white bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? 'Création en cours...' : 'Créer mon compte'}
                {!isLoading && <ArrowRight01Icon size={18} className="ml-2 group-hover:translate-x-1 transition-transform stroke-[2.5]" />}
              </button>
            </form>
          </div>

          <div className="px-6 sm:px-10 py-5 sm:py-6 bg-white/40 backdrop-blur-md border-t border-white/60 text-center relative z-10">
            <p className="text-sm font-medium text-secondary-500">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
