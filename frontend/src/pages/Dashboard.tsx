import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  DocumentValidationIcon, 
  Calendar03Icon, 
  CheckmarkBadge01Icon, 
  Time02Icon,
  ArrowRight01Icon,
  AddSquareIcon,
  UserGroupIcon
} from 'hugeicons-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fake stats to be replaced by real ones via API later
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    validated: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${API_URL}/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const reports = response.data;
        const currentMonth = new Date().getMonth();
        
        setStats({
          total: reports.length,
          thisMonth: reports.filter((r: any) => new Date(r.date).getMonth() === currentMonth).length,
          validated: reports.filter((r: any) => r.clientSignature).length,
          pending: reports.filter((r: any) => !r.clientSignature).length,
        });
      } catch (err) {
        // Fallback to 0 if error
        setStats({ total: 0, thisMonth: 0, validated: 0, pending: 0 });
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900 tracking-tight">Tableau de bord</h1>
          <p className="text-secondary-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">
            Bonjour <span className="text-secondary-900 font-semibold">{user?.firstName || 'Technicien'}</span>, voici un résumé de votre activité.
          </p>
        </div>
        <Link 
          to="/reports/new" 
          className="group flex items-center justify-center bg-primary-700 hover:bg-primary-800 text-white px-5 py-3 sm:px-6 rounded-xl shadow-[0_8px_20px_-6px_rgba(198,40,40,0.4)] font-display font-semibold transition-all active:scale-95 text-sm sm:text-base"
        >
          <AddSquareIcon size={20} className="mr-2" />
          Nouveau Rapport
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1 */}
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-info/10 p-3 sm:p-4 rounded-xl text-info">
            <DocumentValidationIcon size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-secondary-500 mb-0.5 sm:mb-1">Total Rapports</p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900">{stats.total}</h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-primary-50 p-3 sm:p-4 rounded-xl text-primary-700">
            <Calendar03Icon size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-secondary-500 mb-0.5 sm:mb-1">Ce mois-ci</p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900">{stats.thisMonth}</h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-success/10 p-3 sm:p-4 rounded-xl text-success">
            <CheckmarkBadge01Icon size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-secondary-500 mb-0.5 sm:mb-1">Validés</p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900">{stats.validated}</h3>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-warning/10 p-3 sm:p-4 rounded-xl text-warning">
            <Time02Icon size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-secondary-500 mb-0.5 sm:mb-1">En attente</p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-secondary-900">{stats.pending}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Recent Reports */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base sm:text-lg font-display font-bold text-secondary-900">Rapports Récents</h2>
            <Link to="/reports" className="flex items-center text-xs sm:text-sm text-primary-700 hover:text-primary-800 font-semibold group">
              Voir tout <ArrowRight01Icon size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex-1 p-6 sm:p-10 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 sm:p-6 rounded-full text-gray-400 mb-3 sm:mb-4">
              <DocumentValidationIcon size={32} className="sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-secondary-900 mb-1">Aucun rapport récent</h3>
            <p className="text-sm sm:text-base text-secondary-500 max-w-sm">Vous n'avez pas encore créé de rapport d'intervention récemment.</p>
            <Link to="/reports/new" className="mt-4 sm:mt-6 text-sm sm:text-base font-semibold text-primary-700 hover:text-primary-800">
              + Créer un rapport
            </Link>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="bg-primary-700 rounded-2xl shadow-lg p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 text-primary-600 opacity-50">
            <UserGroupIcon size={140} className="sm:w-40 sm:h-40" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-display font-bold mb-3 sm:mb-4 leading-tight">Prêt pour votre prochaine intervention ?</h2>
            <p className="text-primary-100 mb-6 sm:mb-8 text-sm sm:text-base font-medium">
              Remplissez vos rapports directement sur le terrain depuis votre smartphone ou tablette, et faites signer vos clients instantanément.
            </p>
            <Link 
              to="/reports/new" 
              className="inline-flex items-center justify-center w-full sm:w-auto bg-white text-primary-800 px-5 sm:px-6 py-3 rounded-xl font-display font-bold hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Commencer
              <ArrowRight01Icon size={18} className="ml-2" />
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
