import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios';

export default function Charities() {
  const { user, setUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [search, setSearch] = useState('');
  const [percent, setPercent] = useState(user?.charityContributionPercent || 10);
  const [message, setMessage] = useState('');

  const load = async (q = '') => {
    const { data } = await api.get('/charities', { params: q ? { search: q } : {} });
    setCharities(data.charities);
  };

  useEffect(() => {
    load();
  }, []);

  const select = async (charityId) => {
    try {
      const { data } = await api.put('/charities/me/selection', {
        charityId,
        contributionPercent: percent,
      });
      setUser({ ...user, selectedCharity: data.selectedCharity, charityContributionPercent: data.charityContributionPercent });
      setMessage('Charity selection updated.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not update selection');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Charity Directory</h1>
      <p className="text-white/50 mb-8">
        Choose the cause your subscription supports. Minimum contribution is 10%.
      </p>

      <div className="flex gap-3 mb-8">
        <input
          placeholder="Search charities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald"
        />
        {user && (
          <input
            type="number"
            min={10}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald"
            title="Contribution %"
          />
        )}
      </div>

      {message && <p className="text-emerald mb-4">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charities.map((c) => (
          <div key={c._id} className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">{c.name}</h3>
              {c.isFeatured && (
                <span className="text-xs bg-gold text-ink px-2 py-1 rounded-full font-semibold">
                  Featured
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm mb-4">{c.description}</p>
            {user && (
              <button
                onClick={() => select(c._id)}
                className={`text-sm px-4 py-2 rounded-full ${
                  user.selectedCharity === c._id
                    ? 'bg-emerald text-ink font-semibold'
                    : 'border border-white/20 hover:bg-white/10'
                }`}
              >
                {user.selectedCharity === c._id ? 'Selected' : 'Select this charity'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
