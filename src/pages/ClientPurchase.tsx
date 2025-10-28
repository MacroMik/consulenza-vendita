import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, ShoppingCart, User, CreditCard, Calendar } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

const AVAILABLE_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Configurazione PC',
    description: 'Setup completo del sistema operativo e software essenziali',
    price: 89.99,
  },
  {
    id: '2',
    name: 'Protezione Antivirus Premium',
    description: 'Installazione e configurazione antivirus professionale per 1 anno',
    price: 49.99,
  },
  {
    id: '3',
    name: 'Backup e Recupero Dati',
    description: 'Configurazione backup automatico e migrazione dati dal vecchio PC',
    price: 129.99,
  },
  {
    id: '4',
    name: 'Ottimizzazione Prestazioni',
    description: 'Pulizia sistema, rimozione bloatware e ottimizzazione avvio',
    price: 69.99,
  },
  {
    id: '5',
    name: 'Formazione Personalizzata',
    description: '2 ore di formazione one-to-one per sfruttare al meglio il nuovo PC',
    price: 99.99,
  },
];

type Step = 'service' | 'info' | 'payment' | 'appointment' | 'success';

export default function ClientPurchase() {
  const { linkId } = useParams<{ linkId: string }>();
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [serialData, setSerialData] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  useEffect(() => {
    loadSerialData();
  }, [linkId]);

  const loadSerialData = async () => {
    if (!linkId) return;

    const { data, error } = await supabase
      .from('serials')
      .select('*, vendors(*)')
      .eq('link', linkId)
      .eq('is_used', false)
      .maybeSingle();

    if (error || !data) {
      setError('Link non valido o già utilizzato');
    } else {
      setSerialData(data);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('payment');
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Crea o recupera il client nel DB (come prima)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          serial_id: serialData.id,
          vendor_id: serialData.vendor_id,
          name: clientInfo.name,
          email: clientInfo.email,
          phone: clientInfo.phone,
        })
        .select()
        .single();
      if (clientError) throw clientError;

      // 2. Chiedi all'Edge Function di creare la sessione
      const res = await fetch('/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: selectedService!.price,
          description: selectedService!.name,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Errore creazione sessione');
      }
      const { id, error } = await res.json();
      if (error) throw new Error(error);

      // 3. Redirect a Stripe Checkout
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);
      const { error: stripeErr } = await stripe!.redirectToCheckout({ sessionId: id });
      if (stripeErr) throw new Error(stripeErr.message);

      // Il resto (registrare purchase / serial) sarà gestito dal webhook dopo successo
    } catch (err: any) {
      setError(err.message || 'Errore durante il pagamento');
      setLoading(false);
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('serial_id', serialData.id)
        .single();

      if (client) {
        await supabase
          .from('purchases')
          .update({ appointment_date: appointmentDateTime.toISOString() })
          .eq('client_id', client.id);
      }

      setCurrentStep('success');
    } catch (err: any) {
      setError(err.message || 'Errore durante la prenotazione');
    } finally {
      setLoading(false);
    }
  };

  if (error && !serialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Link Non Valido</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!serialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {[
                { step: 'service', icon: ShoppingCart, label: 'Servizio' },
                { step: 'info', icon: User, label: 'Info' },
                { step: 'payment', icon: CreditCard, label: 'Pagamento' },
                { step: 'appointment', icon: Calendar, label: 'Appuntamento' },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 ${
                      currentStep === item.step
                        ? 'text-blue-600'
                        : ['service', 'info', 'payment', 'appointment'].indexOf(currentStep) >
                          ['service', 'info', 'payment', 'appointment'].indexOf(item.step)
                        ? 'text-green-600'
                        : 'text-slate-400'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="hidden md:inline font-medium">{item.label}</span>
                  </div>
                  {idx < 3 && <div className="w-8 h-0.5 bg-slate-300 mx-2" />}
                </div>
              ))}
            </div>
          </div>

          {currentStep === 'service' && (
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Scegli il Tuo Servizio</h1>
              <p className="text-slate-600 mb-8">
                Seleziona il servizio che desideri acquistare per il tuo nuovo PC
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {AVAILABLE_SERVICES.map((service) => (
                  <div
                    key={service.id}
                    className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{service.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                    <p className="text-2xl font-bold text-blue-600">€{service.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'info' && selectedService && (
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Le Tue Informazioni</h1>
              <p className="text-slate-600 mb-8">
                Inserisci i tuoi dati per completare l'acquisto di: <strong>{selectedService.name}</strong>
              </p>

              <form onSubmit={handleInfoSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mario Rossi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mario.rossi@email.it"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Telefono</label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Continua al Pagamento
                </button>
              </form>
            </div>
          )}

          {currentStep === 'payment' && selectedService && (
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Pagamento</h1>
              <p className="text-slate-600 mb-8">Completa il pagamento per il servizio selezionato</p>

              <div className="bg-slate-50 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-700 font-medium">{selectedService.name}</span>
                  <span className="text-xl font-bold text-slate-800">
                    €{selectedService.price.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-slate-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-800">Totale</span>
                    <span className="text-2xl font-bold text-blue-600">
                      €{selectedService.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>


              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Elaborazione...' : 'Completa Pagamento'}
              </button>
            </div>
          )}

          {currentStep === 'appointment' && (
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Prenota Appuntamento</h1>
              <p className="text-slate-600 mb-8">
                Seleziona data e ora per il tuo appuntamento con il tecnico
              </p>

              <form onSubmit={handleAppointmentSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ora</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleziona orario</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Prenotazione...' : 'Conferma Appuntamento'}
                </button>
              </form>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="text-center py-12">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-4">Acquisto Completato!</h1>
              <p className="text-slate-600 text-lg mb-2">
                Grazie per aver scelto i nostri servizi.
              </p>
              <p className="text-slate-600">
                Riceverai una email di conferma con i dettagli del tuo appuntamento.
              </p>
              {appointmentDate && appointmentTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 max-w-md mx-auto">
                  <p className="text-sm text-blue-800 mb-2">Il tuo appuntamento:</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Date(`${appointmentDate}T${appointmentTime}`).toLocaleString('it-IT', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
