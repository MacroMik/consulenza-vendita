import { Users, UserPlus, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TechnicianNavigationProps {
  currentView: 'vendors' | 'clients' | 'register';
  onViewChange: (view: 'vendors' | 'clients' | 'register') => void;
}

export default function TechnicianNavigation({
  currentView,
  onViewChange,
}: TechnicianNavigationProps) {
  const { signOut } = useAuth();

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Tecnico</h1>
          <nav className="flex gap-2">
            <button
              onClick={() => onViewChange('vendors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'vendors'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-5 h-5" />
              Venditori
            </button>
            <button
              onClick={() => onViewChange('clients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'clients'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Clienti
            </button>
            <button
              onClick={() => onViewChange('register')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Registra Venditore
            </button>
          </nav>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Esci
        </button>
      </div>
    </div>
  );
}
