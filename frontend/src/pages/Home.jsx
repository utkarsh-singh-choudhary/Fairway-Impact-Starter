import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl md:text-6xl font-extrabold leading-tight"
      >
        Play your round. <span className="text-emerald">Win a prize.</span>
        <br />
        <span className="text-gold">Change a life.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-6 text-lg text-white/70 max-w-2xl mx-auto"
      >
        Log your last 5 scores, get entered into our monthly draw, and a share of every
        subscription goes straight to a charity you choose. No fairways required to care.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-10 flex justify-center gap-4"
      >
        <Link
          to="/subscribe"
          className="bg-emerald text-ink font-semibold px-8 py-3 rounded-full hover:opacity-90 transition"
        >
          Subscribe & Play
        </Link>
        <Link
          to="/charities"
          className="border border-white/20 px-8 py-3 rounded-full hover:bg-white/10 transition"
        >
          See the Charities
        </Link>
      </motion.div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { title: 'Enter Your Scores', desc: 'Submit your latest Stableford scores in seconds.' },
          { title: 'Monthly Draw', desc: 'Match 3, 4, or 5 numbers to win a share of the pool.' },
          { title: 'Give Back', desc: 'A portion of every subscription funds your chosen cause.' },
        ].map((f) => (
          <div key={f.title} className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-white/60">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
