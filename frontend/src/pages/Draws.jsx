import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Draws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/draws');
      setDraws(data.draws);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Monthly Draw Results</h1>
      {draws.length === 0 && <p className="text-white/50">No draws published yet.</p>}
      <div className="space-y-4">
        {draws.map((d) => (
          <div key={d._id} className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">{d.month}</h2>
              <span className="text-white/50 text-sm capitalize">{d.logicType} draw</span>
            </div>
            <div className="flex gap-2 mb-3">
              {d.winningNumbers.map((n) => (
                <span
                  key={n}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald text-ink font-bold"
                >
                  {n}
                </span>
              ))}
            </div>
            <p className="text-white/50 text-sm">
              Total pool: ${(d.totalPool / 100).toFixed(2)}
              {d.jackpotRolledOverToNextMonth > 0 && ' · Jackpot rolled over to next month'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
