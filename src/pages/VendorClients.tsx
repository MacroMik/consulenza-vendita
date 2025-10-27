import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, Euro, ArrowLeft } from 'lucide-react';

interface ClientWithPurchase {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  purchases: {
    service_name: string;
    service_price: number;
    commission_amount: number;
    appointment_date: string | null;
    payment_status: string;
  }[];
}

interface VendorClientsProps {
  onBack: () => void;
}

export default function VendorClients({ onBack }: VendorClientsProps) {
  const { vendorId } = useAuth();
  const [clients, setClients] = useState<ClientWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    loadClients();
  }, [vendorId]);

  const loadClients = async () => {
    if (!vendorId) return;

    setLoading(true);

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error loading clients:', clientsError);
      setLoading(false);
      return;
    }

    const clientsWithPurchases = await Promise.all(
      (clientsData || []).map(async (client) => {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('service_name, service_price, commission_amount, appointment_date, payment_status')
          .eq('client_id', client.id)
          .eq('payment_status', 'completed');

        return {
          ...client,
          purchases: purchases || [],
        };
      })
    );

    setClients(clientsWithPurchases);

    const total = clientsWithPurchases.reduce((sum, client) => {
      return sum + client.purchases.reduce((pSum, p) => pSum + p.commission_amount, 0);
    }, 0);
    setTotalCommission(total);

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Torna alla Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">I Miei Clienti</h1>
          <p className="text-slate-600">Visualizza i tuoi clienti e le commissioni guadagnate</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Totale Clienti</p>
                <p className="text-2xl font-bold text-slate-800">{clients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Commissioni Totali</p>
                <p className="text-2xl font-bold text-slate-800">€{totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Media per Cliente</p>
                <p className="text-2xl font-bold text-slate-800">
                  €{clients.length > 0 ? (totalCommission / clients.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Lista Clienti</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">Caricamento...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nessun cliente ancora</p>
              <p className="text-slate-400 mt-2">I tuoi clienti appariranno qui dopo il primo acquisto</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => {
                const clientTotal = client.purchases.reduce((sum, p) => sum + p.commission_amount, 0);
                return (
                  <div
                    key={client.id}
                    className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{client.name}</h3>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p>Email: {client.email}</p>
                          <p>Telefono: {client.phone}</p>
                          <p className="text-slate-500">
                            Cliente dal {new Date(client.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>

                        {client.purchases.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-slate-700 mb-2">Acquisti:</h4>
                            <div className="space-y-2">
                              {client.purchases.map((purchase, idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-slate-800">{purchase.service_name}</p>
                                      <p className="text-sm text-slate-600">
                                        Prezzo: €{purchase.service_price.toFixed(2)}
                                      </p>
                                      {purchase.appointment_date && (
                                        <p className="text-sm text-slate-500">
                                          Appuntamento: {new Date(purchase.appointment_date).toLocaleString('it-IT')}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-slate-600">Tua commissione</p>
                                      <p className="text-lg font-bold text-green-600">
                                        €{purchase.commission_amount.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 text-right">
                        <p className="text-sm text-slate-600">Commissioni Totali</p>
                        <p className="text-2xl font-bold text-green-600">€{clientTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
