require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { handleWebhook } = require('./controllers/subscriptionController');

const authRoutes = require('./routes/authRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const charityRoutes = require('./routes/charityRoutes');
const drawRoutes = require('./routes/drawRoutes');
const winnerRoutes = require('./routes/winnerRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cronRoutes = require('./routes/cronRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Ensure a DB connection exists before any route runs. Cheap no-op once
// the connection is cached (see config/db.js).
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ message: 'Database unavailable, please retry' });
  }
});

// Stripe webhook needs the raw body BEFORE express.json() parses it
app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());

// NOTE: local disk uploads (Multer) do NOT persist on Vercel's serverless
// filesystem. Winner proof uploads go to Cloudinary instead — see
// routes/winnerRoutes.js and utils/cloudinary.js. The /uploads static route
// has been removed; if you deploy the backend somewhere with a persistent
// disk (Render/Railway) instead of Vercel, local disk storage would work
// fine and you could reintroduce it.

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron', cronRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
