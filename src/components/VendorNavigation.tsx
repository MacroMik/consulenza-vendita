import { Users, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface VendorNavigationProps {
  currentView: 'dashboard' | 'clients';
  onViewChange: (view: 'dashboard' | 'clients') => void;
}

export default function VendorNavigation({ currentView, onViewChange }: VendorNavigationProps) {
  const { signOut } = useAuth();

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Venditore</h1>
          <nav className="flex gap-2">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => onViewChange('clients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'clients'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-5 h-5" />
              I Miei Clienti
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
