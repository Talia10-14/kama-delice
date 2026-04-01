'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function PointagePage() {
  const [time, setTime] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePointage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage('Tous les champs sont requis');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch('/api/attendance/pointage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType('success');
        setEmail('');
        setPassword('');

        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
      } else {
        setMessage(data.error || 'Erreur lors du pointage');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Une erreur est survenue');
      setMessageType('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-8 md:p-12">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#E8690A] mb-4">
            Kama-Délices
          </h1>
          <p className="text-2xl text-[#6B7280]">Registre de Pointage</p>
        </div>

        {/* Current Time */}
        <div className="text-center mb-12 p-8 bg-gradient-to-r from-[#E8690A] to-[#d25d08] rounded-lg">
          <Clock className="w-12 h-12 text-white mx-auto mb-4" />
          <p className="text-white text-sm mb-2">Heure actuelle</p>
          <p className="text-5xl md:text-7xl font-bold text-white font-mono">
            {time}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-center font-medium ${
              messageType === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handlePointage} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-center text-lg font-medium text-[#374151] mb-3">
              Identifiant
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@kama-delices.com"
              className="w-full px-6 py-4 text-2xl border-2 border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A] text-center"
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-center text-lg font-medium text-[#374151] mb-3">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 text-2xl border-2 border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A] text-center tracking-widest"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-6 bg-[#E8690A] hover:bg-[#d25d08] text-white font-bold text-2xl rounded-lg transition-colors shadow-lg"
          >
            Pointer
          </button>
        </form>

        {/* Info */}
        <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
          <p className="text-center text-sm text-[#6B7280]">
            Touchez le bouton "Pointer" pour enregistrer votre heure d'arrivée ou
            de départ.
          </p>
        </div>
      </div>
    </div>
  );
}
