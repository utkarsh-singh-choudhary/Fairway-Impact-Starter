// Vercel treats every file in /api as a serverless function. This single
// catch-all forwards all /api/* requests into our existing Express app, so
// none of the route/controller code needed to change.
const app = require('../app');

module.exports = app;
