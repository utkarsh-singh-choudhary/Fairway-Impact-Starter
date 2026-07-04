import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ScoreEntry() {
  const [scores, setScores] = useState([]);
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/scores');
      setScores(data.scores);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/scores', { value: Number(value), date });
      setValue('');
      setDate('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add score');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/scores/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete score');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Score Entry</h1>
      <p className="text-white/50 mb-8">
        Only your latest 5 scores are kept. Adding a 6th removes the oldest automatically. One
        score per date — edit or delete an existing entry instead of duplicating.
      </p>

      <form onSubmit={submit} className="flex gap-3 mb-8">
        <input
          type="number"
          min={1}
          max={45}
          placeholder="Score (1–45)"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald"
        />
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald"
        />
        <button className="bg-emerald text-ink font-semibold px-6 rounded-lg hover:opacity-90">
          Add
        </button>
      </form>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="bg-white/5 rounded-2xl divide-y divide-white/10">
        {scores.length === 0 && <p className="p-6 text-white/50">No scores yet.</p>}
        {scores.map((s) => (
          <div key={s._id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{s.value} pts</p>
              <p className="text-white/50 text-sm">{new Date(s.date).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => remove(s._id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
