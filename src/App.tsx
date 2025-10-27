import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import VendorDashboard from './pages/VendorDashboard';
import VendorClients from './pages/VendorClients';
import VendorNavigation from './components/VendorNavigation';
import TechnicianNavigation from './components/TechnicianNavigation';
import TechnicianVendors from './pages/TechnicianVendors';
import TechnicianClients from './pages/TechnicianClients';
import VendorRegistration from './pages/VendorRegistration';
import ClientPurchase from './pages/ClientPurchase';

function VendorApp() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'clients'>('dashboard');

  return (
    <div>
      <VendorNavigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'dashboard' ? (
        <VendorDashboard />
      ) : (
        <VendorClients onBack={() => setCurrentView('dashboard')} />
      )}
    </div>
  );
}

function TechnicianApp() {
  const [currentView, setCurrentView] = useState<'vendors' | 'clients' | 'register'>('vendors');

  return (
    <div>
      <TechnicianNavigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'vendors' && (
        <TechnicianVendors onRegisterVendor={() => setCurrentView('register')} />
      )}
      {currentView === 'clients' && <TechnicianClients />}
      {currentView === 'register' && (
        <VendorRegistration onBack={() => setCurrentView('vendors')} />
      )}
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isVendor, isTechnician, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (isVendor) {
    return <VendorApp />;
  }

  if (isTechnician) {
    return <TechnicianApp />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Accesso Negato</h1>
        <p className="text-slate-600">Il tuo account non ha un ruolo assegnato.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/purchase/:linkId" element={<ClientPurchase />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
