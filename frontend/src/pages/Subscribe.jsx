import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$9.99/mo', blurb: 'Cancel anytime' },
  { id: 'yearly', label: 'Yearly', price: '$89/yr', blurb: 'Save ~25%' },
];

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');

  const choosePlan = async (plan) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    setError('');
    setLoadingPlan(plan);
    try {
      const { data } = await api.post('/subscriptions/checkout', { plan });
      window.location.href = data.url; // redirect to Stripe Checkout
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Choose your plan</h1>
      <p className="text-white/60 mb-10">
        Every plan includes score tracking, monthly draw entry, and a charity contribution.
      </p>
      {error && <p className="text-red-400 mb-6">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((p) => (
          <div key={p.id} className="bg-white/5 rounded-2xl p-8 flex flex-col items-center gap-3">
            <h2 className="text-2xl font-semibold">{p.label}</h2>
            <p className="text-3xl font-bold text-emerald">{p.price}</p>
            <p className="text-white/50 text-sm">{p.blurb}</p>
            <button
              onClick={() => choosePlan(p.id)}
              disabled={loadingPlan === p.id}
              className="mt-4 w-full bg-emerald text-ink font-semibold py-3 rounded-full hover:opacity-90 disabled:opacity-50"
            >
              {loadingPlan === p.id ? 'Redirecting…' : `Choose ${p.label}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
