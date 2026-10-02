// Vercel serverless entry: every /api/* request (and /notify/*, /analytics/* via vercel.json rewrites) lands here.
module.exports = require('../server/app');
