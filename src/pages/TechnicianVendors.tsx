import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, Euro, UserPlus } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  totalSales?: number;
  totalCommissions?: number;
}

interface TechnicianVendorsProps {
  onRegisterVendor: () => void;
}

export default function TechnicianVendors({ onRegisterVendor }: TechnicianVendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);

    const { data: vendorsData, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading vendors:', error);
      setLoading(false);
      return;
    }

    const vendorsWithStats = await Promise.all(
      (vendorsData || []).map(async (vendor) => {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('service_price, commission_amount')
          .eq('vendor_id', vendor.id)
          .eq('payment_status', 'completed');

        const totalSales = purchases?.reduce((sum, p) => sum + p.service_price, 0) || 0;
        const totalCommissions = purchases?.reduce((sum, p) => sum + p.commission_amount, 0) || 0;

        return {
          ...vendor,
          totalSales,
          totalCommissions,
        };
      })
    );

    setVendors(vendorsWithStats);
    setLoading(false);
  };

  const handleToggleActive = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vendors')
      .update({ is_active: !currentStatus })
      .eq('id', vendorId);

    if (!error) {
      await loadVendors();
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (!error) {
      await loadVendors();
    } else {
      console.error('Errore durante l\'eliminazione del venditore:', error);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor.id);
    setEditForm({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      commission_rate: vendor.commission_rate,
    });
  };

  const handleSaveEdit = async (vendorId: string) => {
    const { error } = await supabase
      .from('vendors')
      .update({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        commission_rate: editForm.commission_rate,
      })
      .eq('id', vendorId);

    if (!error) {
      setEditingVendor(null);
      await loadVendors();
    }
  };

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.is_active).length;
  const totalRevenue = vendors.reduce((sum, v) => sum + (v.totalSales || 0), 0);
  const totalCommissionsPaid = vendors.reduce((sum, v) => sum + (v.totalCommissions || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestione Venditori</h1>
            <p className="text-slate-600 mt-1">Monitora e gestisci i tuoi rivenditori PC</p>
          </div>
          <button
            onClick={onRegisterVendor}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Nuovo Venditore
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Venditori Totali</p>
                <p className="text-2xl font-bold text-slate-800">{totalVendors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Attivi</p>
                <p className="text-2xl font-bold text-slate-800">{activeVendors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Euro className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Fatturato Totale</p>
                <p className="text-2xl font-bold text-slate-800">€{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Euro className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Commissioni Pagate</p>
                <p className="text-2xl font-bold text-slate-800">€{totalCommissionsPaid.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Lista Venditori</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">Caricamento...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nessun venditore registrato</p>
              <p className="text-slate-400 mt-2">Inizia registrando il tuo primo venditore</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Nome</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Contatti</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Commissione</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Vendite</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Guadagno</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Stato</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        {editingVendor === vendor.id ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="px-3 py-1 border border-slate-300 rounded"
                          />
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-800">{vendor.name}</p>
                            <p className="text-xs text-slate-500">
                              Dal {new Date(vendor.created_at).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {editingVendor === vendor.id ? (
                          <div className="space-y-1">
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full px-3 py-1 border border-slate-300 rounded text-sm"
                            />
                            <input
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full px-3 py-1 border border-slate-300 rounded text-sm"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-slate-600">
                            <p>{vendor.email}</p>
                            <p>{vendor.phone}</p>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {editingVendor === vendor.id ? (
                          <input
                            type="number"
                            value={(editForm.commission_rate! * 100).toFixed(2)}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                commission_rate: parseFloat(e.target.value) / 100,
                              })
                            }
                            className="w-20 px-3 py-1 border border-slate-300 rounded"
                            step="0.01"
                          />
                        ) : (
                          <span className="font-semibold text-blue-600">
                            {(vendor.commission_rate * 100).toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-slate-800">
                          €{(vendor.totalSales || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-green-600">
                          €{(vendor.totalCommissions || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(vendor.id, vendor.is_active)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            vendor.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {vendor.is_active ? 'Attivo' : 'Disattivo'}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {editingVendor === vendor.id ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleSaveEdit(vendor.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                            >
                              Salva
                            </button>
                            <button
                              onClick={() => setEditingVendor(null)}
                              className="px-3 py-1 bg-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-400"
                            >
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(vendor)}
                              className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300"
                            >
                              Modifica
                            </button>
                            <button
                              onClick={() => {
                                const confirmed = window.confirm('Sei sicuro di voler eliminare questo venditore? Questa azione non è reversibile.');
                                if (confirmed) {
                                  handleDeleteVendor(vendor.id);
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                            >
                              Elimina
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
