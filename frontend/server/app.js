'use strict';
/**
 * Aurum Dental API for Vercel (Node.js serverless).
 * Same endpoints, validation messages and JSON shapes as the Java Spring Boot API in /backend-java,
 * plus the /notify/recent and /analytics/summary endpoints that the Kotlin and Python services provide.
 * Data lives in MongoDB (same collections as the Java version): users, appointments, reviews, notifications, analytics_events.
 *
 * Environment variables: MONGO_URI (required), JWT_SECRET (required), CORS_ORIGINS (optional), APP_TIMEZONE (optional, default Asia/Karachi)
 */
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ helpers */

const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const PHONE = /^[+0-9][0-9 ]{9,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX24 = /^[a-f0-9]{24}$/i;

const TZ = () => process.env.APP_TIMEZONE || 'Asia/Karachi';

/** yyyy-MM-dd for "today + offset days" in the clinic's time zone. */
function day(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  try {
    return d.toLocaleDateString('en-CA', { timeZone: TZ() });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

const isStr = (v) => typeof v === 'string';
const blank = (v) => !isStr(v) || v.trim().length === 0;
const size = (v, min, max) => isStr(v) && v.length >= min && v.length <= max;
const len = (v) => (isStr(v) ? v.length : 0);
const pat = (re, v) => isStr(v) && re.test(v);
const digits = (s) => (isStr(s) ? s.replace(/[^0-9]/g, '') : '');

/** Throws the first failing rule: rules are [ok, message] pairs in field order. */
function check(rules) {
  for (const [ok, message] of rules) if (!ok) throw new HttpError(400, message);
}

function oid(id) {
  return isStr(id) && HEX24.test(id) ? new ObjectId(id) : null;
}

function validDate(s) {
  if (!isStr(s) || !DATE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/* ----------------------------------------------------------------- database */

let clientPromise;
let readyPromise;

function dbNameFrom(uri) {
  if (process.env.MONGO_DB) return process.env.MONGO_DB;
  const m = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/.exec(uri);
  return m ? decodeURIComponent(m[1]) : 'aurum';
}

async function getDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new HttpError(500, 'Server is not configured: MONGO_URI is missing.');
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 })
      .connect()
      .catch((e) => {
        clientPromise = undefined;
        throw e;
      });
  }
  const client = await clientPromise;
  const db = client.db(dbNameFrom(uri));
  if (!readyPromise) {
    readyPromise = prepare(db).catch((e) => {
      readyPromise = undefined;
      throw e;
    });
  }
  await readyPromise;
  return db;
}

async function prepare(db) {
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  } catch {
    /* an equivalent index may already exist under another name; signup also checks for duplicates */
  }
  await seedOnce(db);
}

/** Fills an empty database once with 5 dummy appointments and 6 reviews (same data as the Java seeder). */
async function seedOnce(db) {
  try {
    await db.collection('meta').insertOne({ _id: 'seeded', at: new Date() });
  } catch (e) {
    if (e && e.code === 11000) return; // already seeded (or another instance is seeding right now)
    throw e;
  }
  const appts = db.collection('appointments');
  if ((await appts.countDocuments()) === 0) {
    const mk = (name, phone, service, doctor, offset, time, status) => ({
      name, phone, service, doctor, date: day(offset), time, status,
      note: null, userId: null, createdAt: new Date(),
    });
    await appts.insertMany([
      mk('Hira Siddiqui', '+92 300 1112233', 'Porcelain veneers', 'Dr. Ayesha Khan', 0, '11:00 AM', 'Confirmed'),
      mk('Usman Tariq', '+92 321 4445566', 'Painless root canal', 'Dr. Zain Malik', 0, '03:00 PM', 'Pending'),
      mk('Maryam Ali', '+92 333 7778899', 'Advanced whitening', 'Dr. Ayesha Khan', 1, '12:00 PM', 'Confirmed'),
      mk('Bilal Ahmed', '+92 345 2223344', 'Invisible aligners', 'Dr. Sana Riaz', 2, '05:00 PM', 'Pending'),
      mk('Sadia Noor', '+92 300 9998877', 'Family and kids', 'Dr. Sana Riaz', -1, '10:00 AM', 'Completed'),
    ]);
  }
  const revs = db.collection('reviews');
  if ((await revs.countDocuments()) === 0) {
    const mk = (name, treat, rating, text, daysAgo) => ({
      name, treat, rating, text, date: day(-daysAgo), userId: null,
      createdAt: new Date(Date.now() - daysAgo * 86400000),
    });
    await revs.insertMany([
      mk('Hira Siddiqui', 'Porcelain veneers', 5, "I used to hide my smile in photos. After Dr. Ayesha's veneers I stopped thinking about my teeth at all, which is exactly the point.", 12),
      mk('Usman Tariq', 'Painless root canal', 5, 'My root canal was calmer than most haircuts. The team explained every step before touching anything.', 30),
      mk('Maryam Ali', 'Advanced whitening', 5, 'One visit, eight shades brighter, zero sensitivity. The clinic feels like a spa, not a dentist.', 45),
      mk('Bilal Ahmed', 'Invisible aligners', 4, 'The 3D preview showed my final smile before I started. Nobody at work even noticed I was wearing aligners.', 60),
      mk('Sadia Noor', 'Family and kids', 5, 'My daughter asks when we can go back. I never thought I would hear a child say that about a dentist.', 75),
      mk('Farhan Raza', 'Dental implants', 5, 'Dr. Zain planned everything on screen first. The implant feels completely like my own tooth.', 90),
    ]);
  }
}

/* ------------------------------------------------------------ DTO mapping */

const iso = (d) => (d instanceof Date ? d.toISOString() : d ?? null);

const userDto = (u) => ({ id: String(u._id), name: u.name, email: u.email, phone: u.phone, createdAt: iso(u.createdAt) });

const apptDto = (a) => ({
  id: String(a._id), name: a.name, phone: a.phone, service: a.service, doctor: a.doctor,
  date: a.date, time: a.time, status: a.status, note: a.note ?? null, userId: a.userId ?? null,
  createdAt: iso(a.createdAt),
});

const reviewDto = (r) => ({
  id: String(r._id), name: r.name, treat: r.treat, rating: r.rating, text: r.text, date: r.date,
  userId: r.userId ?? null, createdAt: iso(r.createdAt),
});

const notifDto = (n) => ({ id: String(n._id), type: n.type, message: n.message, appointmentId: n.appointmentId ?? null, at: iso(n.at) });

/* ----------------------------------------------------------- auth (JWT) */

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new HttpError(500, 'Server is not configured: JWT_SECRET is missing.');
  return s;
}

function makeToken(u) {
  return jwt.sign({ name: u.name, email: u.email }, secret(), {
    algorithm: 'HS256',
    subject: String(u._id),
    expiresIn: '168h',
  });
}

function currentUserId(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  try {
    const p = jwt.verify(h.slice(7), secret(), { algorithms: ['HS256'] });
    return p.sub || null;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    return null;
  }
}

function requireUser(req) {
  const id = currentUserId(req);
  if (!id) throw new HttpError(401, 'Please sign in to continue.');
  return id;
}

/* ------------------------------------------------- events (notify + analytics) */

/** Replaces Kafka + Kotlin + Python: stores the notification and bumps the event counter. Never breaks a request. */
async function publish(db, type, a) {
  try {
    const withDoctor = a.doctor && String(a.doctor).trim() ? ` with ${a.doctor}` : '';
    const message =
      type === 'CREATED' ? `New appointment: ${a.name} booked ${a.service}${withDoctor} on ${a.date} at ${a.time}.`
      : type === 'STATUS_CHANGED' ? `Status changed: ${a.name}'s ${a.service} appointment is now ${a.status}.`
      : type === 'DELETED' ? `Appointment removed: ${a.name}'s ${a.service} on ${a.date}.`
      : `Appointment event (${type}) for ${a.name}.`;
    const now = new Date();
    await Promise.all([
      db.collection('notifications').insertOne({ type, message, appointmentId: String(a._id), at: now }),
      db.collection('analytics_events').updateOne({ _id: type }, { $inc: { count: 1 }, $set: { lastAt: now } }, { upsert: true }),
    ]);
  } catch (e) {
    console.warn('Could not publish event', type, e && e.message);
  }
}

/* ----------------------------------------------------------------- routes */

function buildAppointment(r) {
  return {
    name: r.name.trim(),
    phone: r.phone.trim(),
    service: r.service.trim(),
    doctor: blank(r.doctor) ? 'Any available dentist' : r.doctor.trim(),
    date: r.date,
    time: r.time.trim(),
    status: 'Pending',
    note: blank(r.note) ? null : r.note.trim(),
    userId: null,
    createdAt: new Date(),
  };
}

function checkAppointment(r) {
  check([
    [!blank(r.name), 'Enter the patient name.'],
    [size(r.name, 3, 80), 'Name must be 3 to 80 characters.'],
    [!blank(r.phone), 'Enter a phone number.'],
    [pat(PHONE, r.phone), 'Enter a valid phone number.'],
    [!blank(r.service), 'Choose a treatment.'],
    [len(r.service) <= 80, 'size must be between 0 and 80'],
    [r.doctor == null || (isStr(r.doctor) && r.doctor.length <= 80), 'size must be between 0 and 80'],
    [!blank(r.date), 'Pick a date.'],
    [pat(DATE, r.date), 'Enter a valid date.'],
    [!blank(r.time), 'Pick a time.'],
    [len(r.time) <= 20, 'size must be between 0 and 20'],
    [r.note == null || (isStr(r.note) && r.note.length <= 500), 'Notes can be up to 500 characters.'],
  ]);
}

async function route(req, res, method, path, body) {
  /* ---- notify (Kotlin equivalent) ---- */
  if (path === '/notify/health' || path === '/analytics/health') {
    if (method !== 'GET') throw new HttpError(405, 'Method not allowed.');
    return send(res, 200, { status: 'UP' });
  }
  if (path === '/notify/recent') {
    if (method !== 'GET') throw new HttpError(405, 'Method not allowed.');
    const db = await getDb();
    const rows = await db.collection('notifications').find().sort({ at: -1 }).limit(10).toArray();
    return send(res, 200, rows.map(notifDto));
  }

  /* ---- analytics (Python equivalent) ---- */
  if (path === '/analytics/summary') {
    if (method !== 'GET') throw new HttpError(405, 'Method not allowed.');
    const db = await getDb();
    const group = async (field) => {
      const rows = await db.collection('appointments').aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]).toArray();
      return rows.map((r) => ({ name: r._id || 'Unknown', count: r.count }));
    };
    const [total, byTreatment, byDoctor, evs] = await Promise.all([
      db.collection('appointments').countDocuments({ status: { $ne: 'Cancelled' } }),
      group('service'),
      group('doctor'),
      db.collection('analytics_events').find().toArray(),
    ]);
    const events = {};
    for (const e of evs) events[e._id] = e.count;
    return send(res, 200, { total, byTreatment, byDoctor, events });
  }

  /* ---- auth ---- */
  if (path === '/auth/signup') {
    if (method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    const r = { name: body.name, email: body.email, phone: body.phone, password: body.password };
    check([
      [!blank(r.name), 'Enter your full name.'],
      [size(r.name, 3, 80), 'Name must be 3 to 80 characters.'],
      [!blank(r.email), 'Enter your email.'],
      [pat(EMAIL, r.email), 'Enter a valid email.'],
      [!blank(r.phone), 'Enter your phone number.'],
      [pat(PHONE, r.phone), 'Enter a valid phone number.'],
      [!blank(r.password), 'Choose a password.'],
      [size(r.password, 6, 100), 'Use at least 6 characters for the password.'],
    ]);
    const db = await getDb();
    const email = r.email.trim().toLowerCase();
    const users = db.collection('users');
    if (await users.findOne({ email })) throw new HttpError(409, 'An account with this email already exists.');
    const doc = {
      name: r.name.trim(), email, phone: r.phone.trim(),
      passwordHash: await bcrypt.hash(r.password, 10), createdAt: new Date(),
    };
    try {
      const ins = await users.insertOne(doc);
      doc._id = ins.insertedId;
    } catch (e) {
      if (e && e.code === 11000) throw new HttpError(409, 'An account with this email already exists.');
      throw e;
    }
    return send(res, 200, { token: makeToken(doc), user: userDto(doc) });
  }

  if (path === '/auth/login') {
    if (method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    check([
      [!blank(body.email), 'Enter your email.'],
      [pat(EMAIL, body.email), 'Enter a valid email.'],
      [!blank(body.password), 'Enter your password.'],
    ]);
    const db = await getDb();
    const u = await db.collection('users').findOne({ email: body.email.trim().toLowerCase() });
    if (!u || !u.passwordHash || !(await bcrypt.compare(body.password, u.passwordHash))) {
      throw new HttpError(401, 'Wrong email or password.');
    }
    return send(res, 200, { token: makeToken(u), user: userDto(u) });
  }

  if (path === '/auth/reset-password') {
    if (method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    check([
      [!blank(body.email), 'Enter your email.'],
      [pat(EMAIL, body.email), 'Enter a valid email.'],
      [!blank(body.phone), 'Enter your phone number.'],
      [pat(PHONE, body.phone), 'Enter a valid phone number.'],
      [!blank(body.password), 'Choose a new password.'],
      [size(body.password, 6, 100), 'Use at least 6 characters for the password.'],
    ]);
    const db = await getDb();
    const phone = digits(body.phone);
    const u = await db.collection('users').findOne({ email: body.email.trim().toLowerCase() });
    if (!u || !phone || digits(u.phone) !== phone) {
      throw new HttpError(400, 'No account matches this email and phone number.');
    }
    await db.collection('users').updateOne({ _id: u._id }, { $set: { passwordHash: await bcrypt.hash(body.password, 10) } });
    return send(res, 200, { message: 'Password updated. You can sign in now.' });
  }

  if (path === '/auth/me') {
    if (method !== 'GET' && method !== 'DELETE') throw new HttpError(405, 'Method not allowed.');
    const userId = requireUser(req);
    const db = await getDb();
    const _id = oid(userId);
    const u = _id && (await db.collection('users').findOne({ _id }));
    if (!u) throw new HttpError(401, 'Please sign in again.');
    if (method === 'GET') return send(res, 200, userDto(u));
    const mine = await db.collection('appointments').find({ userId }).toArray();
    for (const a of mine) await publish(db, 'DELETED', a);
    await db.collection('appointments').deleteMany({ userId });
    await db.collection('reviews').deleteMany({ userId });
    await db.collection('users').deleteOne({ _id });
    return send(res, 204);
  }

  /* ---- appointments ---- */
  if (path === '/appointments') {
    if (method === 'GET') {
      const db = await getDb();
      return send(res, 200, (await db.collection('appointments').find().toArray()).map(apptDto));
    }
    if (method === 'POST') {
      const userId = requireUser(req);
      checkAppointment(body);
      if (!validDate(body.date)) throw new HttpError(400, 'Enter a valid date.');
      if (body.date < day(-1)) throw new HttpError(400, 'Pick today or a later date.');
      const db = await getDb();
      const doc = buildAppointment(body);
      doc.userId = userId;
      const ins = await db.collection('appointments').insertOne(doc);
      doc._id = ins.insertedId;
      await publish(db, 'CREATED', doc);
      return send(res, 201, apptDto(doc));
    }
    throw new HttpError(405, 'Method not allowed.');
  }

  if (path === '/appointments/mine') {
    if (method !== 'GET') throw new HttpError(405, 'Method not allowed.');
    const userId = requireUser(req);
    const db = await getDb();
    const rows = await db.collection('appointments').find({ userId }).sort({ date: -1, time: -1 }).toArray();
    return send(res, 200, rows.map(apptDto));
  }

  if (path === '/appointments/manual') {
    if (method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    checkAppointment(body);
    if (!validDate(body.date)) throw new HttpError(400, 'Enter a valid date.');
    const db = await getDb();
    const doc = buildAppointment(body);
    const ins = await db.collection('appointments').insertOne(doc);
    doc._id = ins.insertedId;
    await publish(db, 'CREATED', doc);
    return send(res, 201, apptDto(doc));
  }

  let m = /^\/appointments\/([^/]+)\/status$/.exec(path);
  if (m) {
    if (method !== 'PATCH') throw new HttpError(405, 'Method not allowed.');
    check([[!blank(body.status), 'Status is required.']]);
    if (!STATUSES.includes(body.status)) throw new HttpError(400, 'Unknown status.');
    const db = await getDb();
    const _id = oid(m[1]);
    const a = _id && (await db.collection('appointments').findOneAndUpdate({ _id }, { $set: { status: body.status } }, { returnDocument: 'after' }));
    if (!a) throw new HttpError(404, 'Appointment not found.');
    await publish(db, 'STATUS_CHANGED', a);
    return send(res, 200, apptDto(a));
  }

  m = /^\/appointments\/([^/]+)$/.exec(path);
  if (m) {
    if (method !== 'DELETE') throw new HttpError(405, 'Method not allowed.');
    const db = await getDb();
    const _id = oid(m[1]);
    const a = _id && (await db.collection('appointments').findOneAndDelete({ _id }));
    if (!a) throw new HttpError(404, 'Appointment not found.');
    await publish(db, 'DELETED', a);
    return send(res, 204);
  }

  /* ---- reviews ---- */
  if (path === '/reviews') {
    if (method === 'GET') {
      const db = await getDb();
      return send(res, 200, (await db.collection('reviews').find().sort({ createdAt: -1 }).toArray()).map(reviewDto));
    }
    if (method === 'POST') {
      const userId = requireUser(req);
      const rating = typeof body.rating === 'number' ? body.rating : Number(body.rating);
      check([
        [!blank(body.name), 'Enter your name.'],
        [size(body.name, 3, 80), 'Name must be 3 to 80 characters.'],
        [!blank(body.treat), 'Choose a treatment.'],
        [len(body.treat) <= 80, 'size must be between 0 and 80'],
        [Number.isInteger(rating) && rating >= 1, 'Choose a rating from 1 to 5.'],
        [rating <= 5, 'Choose a rating from 1 to 5.'],
        [!blank(body.text), 'Write your review.'],
        [size(body.text, 15, 1000), 'Write between 15 and 1000 characters.'],
      ]);
      const db = await getDb();
      const doc = {
        name: body.name.trim(), treat: body.treat.trim(), rating, text: body.text.trim(),
        date: day(0), userId, createdAt: new Date(),
      };
      const ins = await db.collection('reviews').insertOne(doc);
      doc._id = ins.insertedId;
      return send(res, 201, reviewDto(doc));
    }
    throw new HttpError(405, 'Method not allowed.');
  }

  m = /^\/reviews\/([^/]+)$/.exec(path);
  if (m) {
    if (method !== 'DELETE') throw new HttpError(405, 'Method not allowed.');
    const db = await getDb();
    const _id = oid(m[1]);
    const r = _id && (await db.collection('reviews').deleteOne({ _id }));
    if (!r || r.deletedCount === 0) throw new HttpError(404, 'Review not found.');
    return send(res, 204);
  }

  throw new HttpError(404, 'Not found.');
}

/* ------------------------------------------------------------ HTTP plumbing */

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  if (status === 204 || data === undefined) return res.end();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowed = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  }
}

async function readBody(req) {
  let b;
  try {
    b = req.body;
  } catch {
    throw new HttpError(400, 'Malformed request.');
  }
  if (b === undefined || b === null) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    b = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(b)) b = b.toString('utf8');
  if (typeof b === 'string') {
    if (!b.trim()) return {};
    try {
      b = JSON.parse(b);
    } catch {
      throw new HttpError(400, 'Malformed request.');
    }
  }
  return b && typeof b === 'object' && !Array.isArray(b) ? b : {};
}

function normalisePath(url) {
  let p = new URL(url, 'http://localhost').pathname.replace(/\/+$/, '') || '/';
  if (p === '/api') return '/';
  if (p.startsWith('/api/')) p = p.slice(4);
  return p;
}

async function handler(req, res) {
  try {
    applyCors(req, res);
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') return send(res, 204);
    const body = method === 'POST' || method === 'PATCH' || method === 'PUT' ? await readBody(req) : {};
    await route(req, res, method, normalisePath(req.url || '/'), body);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { message: e.message });
    console.error('Unhandled error:', e);
    return send(res, 500, { message: 'Something went wrong on the server. Please try again.' });
  }
}

module.exports = handler;
module.exports.handler = handler;
