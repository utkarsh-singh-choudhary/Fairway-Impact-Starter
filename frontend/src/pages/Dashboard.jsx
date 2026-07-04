import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [scores, setScores] = useState([]);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [subRes, participationRes] = await Promise.all([
          api.get('/subscriptions/me'),
          api.get('/draws/me/participation'),
        ]);
        setSubscription(subRes.data.subscription);
        setParticipation(participationRes.data);

        if (user?.subscriptionStatus === 'active') {
          const scoreRes = await api.get('/scores');
          setScores(scoreRes.data.scores);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <div className="p-10 text-center">Loading dashboard…</div>;

  const totalWon = participation?.winnings?.reduce((sum, w) => sum + w.prizeAmount, 0) || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Welcome back, {user?.name?.split(' ')[0]}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card title="Subscription">
          <p className="text-lg font-semibold capitalize">{user?.subscriptionStatus}</p>
          {subscription && (
            <p className="text-white/50 text-sm mt-1">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
          {user?.subscriptionStatus !== 'active' && (
            <Link to="/subscribe" className="text-emerald text-sm mt-2 inline-block">
              Subscribe now →
            </Link>
          )}
        </Card>

        <Card title="Charity">
          <p className="text-lg font-semibold">
            {user?.selectedCharity ? 'Selected' : 'Not selected'}
          </p>
          <p className="text-white/50 text-sm mt-1">
            Contribution: {user?.charityContributionPercent || 10}%
          </p>
          <Link to="/charities" className="text-emerald text-sm mt-2 inline-block">
            Manage selection →
          </Link>
        </Card>

        <Card title="Winnings">
          <p className="text-lg font-semibold">${(totalWon / 100).toFixed(2)} total won</p>
          <p className="text-white/50 text-sm mt-1">
            {participation?.drawsEntered || 0} draws entered
          </p>
        </Card>
      </div>

      <div className="bg-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Latest Scores</h2>
          <Link to="/scores" className="text-emerald text-sm">
            Manage scores →
          </Link>
        </div>
        {scores.length === 0 ? (
          <p className="text-white/50">
            {user?.subscriptionStatus === 'active'
              ? 'No scores entered yet.'
              : 'Subscribe to start entering scores.'}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-white/50">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s._id} className="border-t border-white/10">
                  <td className="py-2">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="py-2">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6">
      <h3 className="text-white/50 text-sm uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </div>
  );
}
