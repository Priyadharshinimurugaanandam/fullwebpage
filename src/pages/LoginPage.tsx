// src/pages/LoginPage.tsx ← FINAL & 100% WORKING
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Lock, Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'support' | 'surgeon'>('surgeon');
  const [password, setPassword] = useState('');
  const [selectedSurgeon, setSelectedSurgeon] = useState('');
  const [surgeons, setSurgeons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('surgeries')
        .select('surgeon_name')
        .not('surgeon_name', 'is', null);

      const names = [...new Set(data?.map(r => r.surgeon_name.trim()).filter(Boolean) || [])].sort();
      setSurgeons(names);
      if (names.length === 1) setSelectedSurgeon(names[0]);
    };
    load();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'surgeon' && !selectedSurgeon) {
      setError('Please select your name');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'support') {
        if (password !== 'support123') {
          setError('Wrong support password');
          setLoading(false);
          return;
        }
        localStorage.setItem('current_user', JSON.stringify({
          username: 'Support Team',
          role: 'support',
          isSupport: true
        }));
        window.location.href = '/';
        return;
      }

      const name = selectedSurgeon.trim();

      const { data: user, error } = await supabase
        .from('users')
        .select('password')
        .eq('username', name)
        .single();

      if (error || !user) {
        setError('Account not activated. Contact support to set your password.');
        setLoading(false);
        return;
      }

      if (!user.password) {
        setError('Password not set yet. Please contact support team.');
        setLoading(false);
        return;
      }

      if (user.password !== password) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }
blob:https://teams.microsoft.com/66478634-c853-4346-99c1-9788d2351507
      localStorage.setItem('current_user', JSON.stringify({
        username: name,
        role: 'surgeon',
        isSupport: false
      }));

      window.location.href = '/';

    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-cover bg-center" style={{ backgroundImage: '  ' }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 bg-white backdrop-blur-sm rounded-3xl shadow-3xl w-full max-w-xl border border-white/30 overflow-hidden">
        <div className="bg-gradient-to-r from-[#00938e] to-teal-600 text-white p-14 text-center">
          <h1 className="text-6xl font-bold">MISSO</h1>
          <p className="text-xl mt-3 opacity-90">Robotic Insights Platform</p>
        </div>

        <div className="p-12">
          <div className="flex justify-center mb-10">
            <div className="bg-gray-100 p-2 rounded-xl inline-flex shadow-inner">
              <button onClick={() => setMode('support')} className={`px-8 py-4 rounded-lg font-bold flex items-center gap-3 ${mode === 'support' ? 'bg-[#F4BB44] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}>
                <Shield size={26} /> Support
              </button>
              <button onClick={() => setMode('surgeon')} className={`px-8 py-4 rounded-lg font-bold flex items-center gap-3 ${mode === 'surgeon' ? 'bg-[#F4BB44] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}>
                <User size={26} /> Surgeon
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            {mode === 'surgeon' && (
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="text-[#00938e]" size={22} /> Select Your Name
                </label>
                {surgeons.length === 0 ? (
                  <div className="text-center py-12 bg-red-50 rounded-2xl border-2 border-red-200">
                    <p className="text-red-700 font-medium">No surgeons found</p>
                  </div>
                ) : (
                  <select value={selectedSurgeon} onChange={e => setSelectedSurgeon(e.target.value)} required className="w-full px-6 py-5 text-lg border-2 border-[#00938e] rounded-xl focus:ring-4 focus:ring-teal-200 bg-white">
                    <option value="">Choose Surgeon</option>
                    {surgeons.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="text-[#00938e]" size={22} /> Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-6 py-5 text-lg border-2 border-gray-300 rounded-xl focus:border-[#00938e] focus:ring-4 focus:ring-teal-200" />
            </div>

            {error && <div className="bg-red-100 border-2 border-red-400 text-red-700 p-5 rounded-xl text-center font-semibold">{error}</div>}

            <button type="submit" disabled={loading || (mode === 'surgeon' && !selectedSurgeon)} className="w-full bg-gradient-to-r from-[#00938e] to-teal-600 text-white py-6 rounded-xl text-2xl font-bold hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
              {loading ? <>Logging in...</> : 'Enter Dashboard'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-10">
            Powered by <span className="font-bold text-[#00938e]">MISSO System Insights</span>
          </p>
        </div>
      </div>
    </div>
  );
}