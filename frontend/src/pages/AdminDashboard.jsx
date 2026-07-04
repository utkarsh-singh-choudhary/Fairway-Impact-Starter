import { useEffect, useState } from 'react';
import api from '../api/axios';

const TABS = ['Overview', 'Users', 'Draws', 'Charities', 'Winners'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Control Center</h1>
      <div className="flex gap-2 mb-8 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t ? 'text-emerald border-b-2 border-emerald' : 'text-white/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Users' && <UsersTab />}
      {tab === 'Draws' && <DrawsTab />}
      {tab === 'Charities' && <CharitiesTab />}
      {tab === 'Winners' && <WinnersTab />}
    </div>
  );
}

function OverviewTab() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get('/admin/reports/overview').then(({ data }) => setReport(data));
  }, []);

  if (!report) return <p className="text-white/50">Loading report…</p>;

  const stats = [
    ['Total Users', report.totalUsers],
    ['Active Subscribers', report.activeSubscribers],
    ['Total Charities', report.totalCharities],
    ['Draws Run', report.totalDrawsRun],
    ['Total Prize Pool', `$${(report.totalPrizePool / 100).toFixed(2)}`],
    ['Total Paid Out', `$${(report.totalPaidOut / 100).toFixed(2)}`],
    ['Charity Contributions', `$${(report.totalCharityContributions / 100).toFixed(2)}`],
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(([label, value]) => (
        <div key={label} className="bg-white/5 rounded-2xl p-5">
          <p className="text-white/50 text-xs uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const load = async (q = '') => {
    const { data } = await api.get('/admin/users', { params: q ? { search: q } : {} });
    setUsers(data.users);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <input
        placeholder="Search users…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && load(search)}
        className="mb-4 w-full max-w-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-emerald"
      />
      <table className="w-full text-left text-sm bg-white/5 rounded-2xl overflow-hidden">
        <thead className="text-white/50 bg-white/5">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Status</th>
            <th className="p-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t border-white/10">
              <td className="p-3">{u.name}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3 capitalize">{u.subscriptionStatus}</td>
              <td className="p-3 capitalize">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DrawsTab() {
  const [month, setMonth] = useState('');
  const [logicType, setLogicType] = useState('random');
  const [algorithmicMode, setAlgorithmicMode] = useState('most_frequent');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');

  const simulate = async () => {
    setMessage('');
    try {
      const { data } = await api.post('/admin/draws/simulate', {
        month,
        logicType,
        algorithmicMode,
      });
      setPreview(data.draw);
      setMessage('Simulation complete — review before publishing.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Simulation failed');
    }
  };

  const publish = async () => {
    if (!preview?._id) return;
    setMessage('');
    try {
      const { data } = await api.post(`/admin/draws/${preview._id}/publish`);
      setMessage(
        `Published. Winners created: ${data.winnersCreated} (5:${data.breakdown.fiveMatchWinners} 4:${data.breakdown.fourMatchWinners} 3:${data.breakdown.threeMatchWinners})`
      );
    } catch (err) {
      setMessage(err.response?.data?.message || 'Publish failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-2xl p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-white/50 text-sm mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-white/50 text-sm mb-1">Logic type</label>
          <select
            value={logicType}
            onChange={(e) => setLogicType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
          >
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic</option>
          </select>
        </div>
        {logicType === 'algorithmic' && (
          <div>
            <label className="block text-white/50 text-sm mb-1">Algorithmic bias</label>
            <select
              value={algorithmicMode}
              onChange={(e) => setAlgorithmicMode(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
            >
              <option value="most_frequent">Most frequent scores</option>
              <option value="least_frequent">Least frequent scores</option>
            </select>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={simulate} className="bg-white/10 px-5 py-2 rounded-full hover:bg-white/20">
            Simulate
          </button>
          <button
            onClick={publish}
            disabled={!preview}
            className="bg-emerald text-ink font-semibold px-5 py-2 rounded-full hover:opacity-90 disabled:opacity-40"
          >
            Publish
          </button>
        </div>
        {message && <p className="text-emerald text-sm">{message}</p>}
      </div>

      {preview && (
        <div className="bg-white/5 rounded-2xl p-6 max-w-lg">
          <h3 className="font-semibold mb-2">Preview — {preview.month}</h3>
          <div className="flex gap-2 mb-3">
            {preview.winningNumbers.map((n) => (
              <span
                key={n}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gold text-ink font-bold"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="text-white/50 text-sm">
            Total pool: ${(preview.totalPool / 100).toFixed(2)} · Subscribers:{' '}
            {preview.activeSubscriberCountAtDraw}
          </p>
        </div>
      )}
    </div>
  );
}

function CharitiesTab() {
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '', category: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data } = await api.get('/charities');
    setCharities(data.charities);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/admin/charities', form);
      setForm({ name: '', slug: '', description: '', category: '' });
      setMessage('Charity created.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create charity');
    }
  };

  const remove = async (id) => {
    await api.delete(`/admin/charities/${id}`);
    load();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <form onSubmit={create} className="bg-white/5 rounded-2xl p-6 space-y-3 h-fit">
        <h3 className="font-semibold mb-2">Add Charity</h3>
        <input
          placeholder="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
        />
        <input
          placeholder="Slug (url-safe-name)"
          required
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
        />
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
        />
        <textarea
          placeholder="Description"
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
          rows={3}
        />
        <button className="bg-emerald text-ink font-semibold px-5 py-2 rounded-full hover:opacity-90">
          Create
        </button>
        {message && <p className="text-emerald text-sm">{message}</p>}
      </form>

      <div className="space-y-3">
        {charities.map((c) => (
          <div key={c._id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-white/50 text-sm">{c.category}</p>
            </div>
            <button onClick={() => remove(c._id)} className="text-red-400 text-sm hover:text-red-300">
              Deactivate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinnersTab() {
  const [winners, setWinners] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = async (status) => {
    const { data } = await api.get('/admin/winners', { params: status ? { status } : {} });
    setWinners(data.winners);
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const verify = async (id, decision) => {
    await api.put(`/admin/winners/${id}/verify`, { decision });
    load(statusFilter);
  };

  const pay = async (id) => {
    await api.put(`/admin/winners/${id}/pay`);
    load(statusFilter);
  };

  return (
    <div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="mb-4 bg-white/5 border border-white/10 rounded-lg px-4 py-2"
      >
        <option value="pending">Pending Verification</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="">All</option>
      </select>

      <div className="space-y-3">
        {winners.map((w) => (
          <div key={w._id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {w.user.name} — {w.matchType} — ${(w.prizeAmount / 100).toFixed(2)}
              </p>
              <p className="text-white/50 text-sm">
                Draw {w.draw.month} · Verification: {w.verification.status} · Payment:{' '}
                {w.payment.status}
              </p>
            </div>
            <div className="flex gap-2">
              {w.verification.status === 'pending' && (
                <>
                  <button
                    onClick={() => verify(w._id, 'approved')}
                    className="text-emerald text-sm px-3 py-1 rounded-full border border-emerald/40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => verify(w._id, 'rejected')}
                    className="text-red-400 text-sm px-3 py-1 rounded-full border border-red-400/40"
                  >
                    Reject
                  </button>
                </>
              )}
              {w.verification.status === 'approved' && w.payment.status === 'pending' && (
                <button
                  onClick={() => pay(w._id)}
                  className="text-gold text-sm px-3 py-1 rounded-full border border-gold/40"
                >
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
        {winners.length === 0 && <p className="text-white/50">No winners in this filter.</p>}
      </div>
    </div>
  );
}
