import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  vendor: {
    name: string;
  };
  purchases: {
    id: string;
    service_name: string;
    service_price: number;
    commission_amount: number;
    appointment_date: string | null;
    appointment_status: string;
    payment_status: string;
  }[];
}

export default function TechnicianClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);

    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*, vendors(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading clients:', error);
      setLoading(false);
      return;
    }

    const clientsWithPurchases = await Promise.all(
      (clientsData || []).map(async (client) => {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('*')
          .eq('client_id', client.id);

        return {
          ...client,
          vendor: client.vendors,
          purchases: purchases || [],
        };
      })
    );

    setClients(clientsWithPurchases);
    setLoading(false);
  };

  const handleUpdateAppointmentStatus = async (
    purchaseId: string,
    newStatus: 'scheduled' | 'completed' | 'cancelled'
  ) => {
    const { error } = await supabase
      .from('purchases')
      .update({ appointment_status: newStatus })
      .eq('id', purchaseId);

    if (!error) {
      await loadClients();
    }
  };

  const filteredClients = clients.filter((client) => {
    if (filterStatus === 'all') return true;
    return client.purchases.some((p) => p.appointment_status === filterStatus);
  });

  const totalClients = clients.length;
  const scheduledAppointments = clients.reduce(
    (sum, c) => sum + c.purchases.filter((p) => p.appointment_status === 'scheduled').length,
    0
  );
  const completedAppointments = clients.reduce(
    (sum, c) => sum + c.purchases.filter((p) => p.appointment_status === 'completed').length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Gestione Clienti</h1>
          <p className="text-slate-600 mt-1">Monitora clienti e appuntamenti</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Clienti Totali</p>
                <p className="text-2xl font-bold text-slate-800">{totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Appuntamenti Attivi</p>
                <p className="text-2xl font-bold text-slate-800">{scheduledAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Completati</p>
                <p className="text-2xl font-bold text-slate-800">{completedAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tasso Completamento</p>
                <p className="text-2xl font-bold text-slate-800">
                  {scheduledAppointments + completedAppointments > 0
                    ? Math.round(
                        (completedAppointments / (scheduledAppointments + completedAppointments)) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Lista Clienti</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setFilterStatus('scheduled')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Programmati
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Completati
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">Caricamento...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nessun cliente trovato</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{client.name}</h3>
                      <div className="text-sm text-slate-600 mt-1 space-y-1">
                        <p>Email: {client.email}</p>
                        <p>Telefono: {client.phone}</p>
                        <p>Venditore: <span className="font-medium">{client.vendor.name}</span></p>
                        <p className="text-slate-500">
                          Cliente dal {new Date(client.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {client.purchases.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-semibold text-slate-700">Acquisti e Appuntamenti:</h4>
                      {client.purchases.map((purchase) => (
                        <div key={purchase.id} className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-slate-800">{purchase.service_name}</p>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    purchase.appointment_status === 'completed'
                                      ? 'bg-green-100 text-green-700'
                                      : purchase.appointment_status === 'cancelled'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  {purchase.appointment_status === 'completed'
                                    ? 'Completato'
                                    : purchase.appointment_status === 'cancelled'
                                    ? 'Annullato'
                                    : 'Programmato'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                Prezzo: €{purchase.service_price.toFixed(2)} | Commissione: €
                                {purchase.commission_amount.toFixed(2)}
                              </p>
                              {purchase.appointment_date && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-slate-700">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(purchase.appointment_date).toLocaleString('it-IT', {
                                      dateStyle: 'full',
                                      timeStyle: 'short',
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {purchase.appointment_status === 'scheduled' && (
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() =>
                                    handleUpdateAppointmentStatus(purchase.id, 'completed')
                                  }
                                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Completa
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateAppointmentStatus(purchase.id, 'cancelled')
                                  }
                                  className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Annulla
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
