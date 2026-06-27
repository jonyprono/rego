import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, PlusCircle, User, LogOut } from 'lucide-react';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary-600">Intervention Pro</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/" className="flex items-center space-x-2 p-2 rounded hover:bg-primary-50 text-gray-700">
            <User size={20} />
            <span>Tableau de bord</span>
          </Link>
          <Link to="/reports/new" className="flex items-center space-x-2 p-2 rounded hover:bg-primary-50 text-gray-700">
            <PlusCircle size={20} />
            <span>Nouveau Rapport</span>
          </Link>
          <Link to="/reports" className="flex items-center space-x-2 p-2 rounded hover:bg-primary-50 text-gray-700">
            <FileText size={20} />
            <span>Mes Rapports</span>
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <button onClick={handleLogout} className="flex items-center space-x-2 text-red-600 w-full p-2 hover:bg-red-50 rounded">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
