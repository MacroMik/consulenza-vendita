import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, QrCode, Link as LinkIcon, Copy, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface Serial {
  id: string;
  serial_number: string;
  qr_code: string;
  link: string;
  is_used: boolean;
  created_at: string;
}

export default function VendorDashboard() {
  const { signOut, vendorId } = useAuth();
  const [serialNumber, setSerialNumber] = useState('');
  const [serials, setSerials] = useState<Serial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadSerials();
  }, [vendorId]);

  const loadSerials = async () => {
    if (!vendorId) return;

    const { data, error } = await supabase
      .from('serials')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading serials:', error);
    } else {
      setSerials(data || []);
    }
  };

  const handleAddSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const uniqueId = crypto.randomUUID();
      const link = `${window.location.origin}/purchase/${uniqueId}`;

      const qrCodeDataUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
      });

      // Calcola hash SHA-256 esadecimale del QR
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(qrCodeDataUrl));
      const qrHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const { error: insertError } = await supabase
        .from('serials')
        .insert({
          serial_number: serialNumber,
          vendor_id: vendorId!,
          qr_code: qrCodeDataUrl,
          qr_hash: qrHash,
          link: uniqueId,
        });

      if (insertError) throw insertError;

      setSerialNumber('');
      await loadSerials();
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiunta del seriale');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard Venditore</h1>
            <p className="text-slate-600 mt-1">Gestisci i seriali PC e monitora le vendite</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            Esci
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Aggiungi Seriale PC</h2>
          </div>

          <form onSubmit={handleAddSerial} className="flex gap-4">
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Inserisci numero seriale PC"
              required
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aggiungi...' : 'Aggiungi'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Seriali Registrati</h2>

          {serials.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nessun seriale registrato ancora</p>
              <p className="text-slate-400 mt-2">Aggiungi il tuo primo seriale PC per iniziare</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serials.map((serial) => (
                <div
                  key={serial.id}
                  className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-bold text-slate-800">
                          {serial.serial_number}
                        </h3>
                        {serial.is_used && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Utilizzato
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <LinkIcon className="w-5 h-5 text-slate-400" />
                          <code className="text-sm text-slate-600 bg-slate-50 px-3 py-1 rounded flex-1">
                            {window.location.origin}/purchase/{serial.link}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/purchase/${serial.link}`, `link-${serial.id}`)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            {copiedId === `link-${serial.id}` ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <p className="text-sm text-slate-500">
                          Creato il {new Date(serial.created_at).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <img
                        src={serial.qr_code}
                        alt="QR Code"
                        className="w-32 h-32 border-2 border-slate-200 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = serial.qr_code;
                          link.download = `qr-${serial.serial_number}.png`;
                          link.click();
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Scarica QR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
