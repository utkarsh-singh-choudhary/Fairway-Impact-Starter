import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/subscribe');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-6">Create your account</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          placeholder="Full name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-emerald text-ink font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
      <p className="mt-4 text-white/60 text-sm">
        Already have an account? <Link to="/login" className="text-emerald">Log in</Link>
      </p>
    </div>
  );
}
