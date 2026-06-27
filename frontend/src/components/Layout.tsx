import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, PlusCircle, User, LogOut, Home } from 'lucide-react';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <img src="/logo rego.jpg" alt="Rego" className="h-12 object-contain" />
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            to="/" 
            className={`flex items-center space-x-3 p-3 rounded-xl transition-all font-medium ${isActive('/') ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Home size={22} className={isActive('/') ? 'text-primary-600' : 'text-gray-400'} />
            <span>Tableau de bord</span>
          </Link>
          <Link 
            to="/reports/new" 
            className={`flex items-center space-x-3 p-3 rounded-xl transition-all font-medium ${isActive('/reports/new') ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <PlusCircle size={22} className={isActive('/reports/new') ? 'text-primary-600' : 'text-gray-400'} />
            <span>Nouveau Rapport</span>
          </Link>
          <Link 
            to="/reports" 
            className={`flex items-center space-x-3 p-3 rounded-xl transition-all font-medium ${isActive('/reports') && !isActive('/reports/new') ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <FileText size={22} className={isActive('/reports') && !isActive('/reports/new') ? 'text-primary-600' : 'text-gray-400'} />
            <span>Mes Rapports</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center space-x-2 text-red-600 w-full p-3 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative pb-20 md:pb-0">
        {/* Mobile Header (Top) */}
        <div className="md:hidden bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center justify-center">
          <img src="/logo rego.jpg" alt="Rego" className="h-8 object-contain" />
        </div>
        
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center pb-safe z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-full py-3 space-y-1 ${isActive('/') ? 'text-primary-700' : 'text-gray-500'}`}
        >
          <div className={`p-1.5 rounded-full transition-colors ${isActive('/') ? 'bg-primary-50' : ''}`}>
            <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-semibold">Accueil</span>
        </Link>
        <Link 
          to="/reports/new" 
          className="flex flex-col items-center justify-center w-full py-2 space-y-1 relative -top-3"
        >
          <div className="bg-primary-600 text-white p-3.5 rounded-full shadow-lg shadow-primary-500/40 border-4 border-gray-50">
            <PlusCircle size={26} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-semibold text-gray-700 mt-1">Nouveau</span>
        </Link>
        <Link 
          to="/reports" 
          className={`flex flex-col items-center justify-center w-full py-3 space-y-1 ${isActive('/reports') && !isActive('/reports/new') ? 'text-primary-700' : 'text-gray-500'}`}
        >
          <div className={`p-1.5 rounded-full transition-colors ${isActive('/reports') && !isActive('/reports/new') ? 'bg-primary-50' : ''}`}>
            <FileText size={24} strokeWidth={isActive('/reports') && !isActive('/reports/new') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-semibold">Rapports</span>
        </Link>
        <button 
          onClick={handleLogout} 
          className="flex flex-col items-center justify-center w-full py-3 space-y-1 text-gray-500 hover:text-red-600"
        >
          <div className="p-1.5 rounded-full">
            <LogOut size={24} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-semibold">Quitter</span>
        </button>
      </nav>
    </div>
  );
}
