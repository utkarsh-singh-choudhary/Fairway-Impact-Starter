// Local development entrypoint only. Vercel uses api/index.js instead,
// which imports the same app.js but never calls .listen().
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
