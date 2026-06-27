import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserIcon, 
  Mail01Icon, 
  LockPasswordIcon, 
  SmartPhone01Icon, 
  AddTeamIcon, 
  ArrowRight01Icon,
  CheckmarkCircle02Icon
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
      await axios.post('http://localhost:3000/api/auth/register', {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background with subtle shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-primary-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      <div className="w-full max-w-xl z-10">
        <div className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="px-10 pt-10 pb-6 text-center">
            <div className="flex justify-center mb-6">
              <img src="/logo rego.jpg" alt="Logo Rego" className="h-20 object-contain" />
            </div>
            <h2 className="text-3xl font-display font-bold text-secondary-900 tracking-tight">Créer un compte</h2>
            <p className="text-secondary-500 mt-3 font-sans text-sm">Rejoignez-nous pour gérer vos rapports d'intervention de manière professionnelle.</p>
          </div>

          <div className="px-10 pb-10">
            {error && (
              <div className="flex items-center bg-warning/10 text-warning p-4 rounded-xl mb-8 text-sm font-medium border border-warning/20">
                <div className="mr-3 bg-warning/20 p-1 rounded-full"><LockPasswordIcon size={16} /></div>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                {/* Prénom */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary-700">Prénom</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                      <UserIcon size={20} />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                      placeholder="Jean"
                    />
                  </div>
                </div>

                {/* Nom */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary-700">Nom</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                      <UserIcon size={20} />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-secondary-700">Adresse Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                    <Mail01Icon size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                    placeholder="technicien@entreprise.com"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-secondary-700">Téléphone</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                    <SmartPhone01Icon size={20} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary-700">Mot de passe</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                      <LockPasswordIcon size={20} />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Confirm Mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary-700">Confirmation</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-500 group-focus-within:text-primary-700 transition-colors">
                      <CheckmarkCircle02Icon size={20} />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 flex justify-center items-center py-4 px-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(198,40,40,0.4)] text-sm font-display font-semibold text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? 'Inscription en cours...' : 'Créer mon compte'}
                {!isLoading && <ArrowRight01Icon size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-gray-50/80 border-t border-gray-100 text-center">
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
