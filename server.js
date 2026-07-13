const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ensure data directory exists for simple persistence
const defaultDataDir = path.join(__dirname, 'data');
const tmpDataDir = path.join(process.env.TMP || process.env.TEMP || '/tmp', 'applianceshub-data');
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? tmpDataDir : defaultDataDir);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function safeLoad(fileName, fallback = []) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw || '[]');
    }
  } catch (e) {
    console.warn('Failed to load', fileName, e);
  }
  return fallback;
}

function safeSave(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save', fileName, e);
  }
}

// load persisted stores (if any)
const blogs = safeLoad('blogs.json', []);
const sells = safeLoad('sells.json', []);
let blogIdCounter = blogs.reduce((max, b) => Math.max(max, b.id || 0), 0) + 1;
let sellIdCounter = sells.reduce((max, s) => Math.max(max, s.id || 0), 0) + 1;
// Simple in-memory settings store (replace with DB in production)
let serverSettings = { adminName: 'Administrator', adminEmail: '', darkMode: false, emailNotifications: true, defaultView: 'dashboard' };

app.get('/api', (req, res) => {
  res.json({ message: 'Elite Repair API is running' });
});

app.get('/api/blogs', (req, res) => {
  res.json(blogs);
});

app.post('/api/blogs', (req, res) => {
  const { title, author, content, category } = req.body;

  if (!title || !author || !content || !category) {
    return res.status(400).json({ message: 'Please fill all blog fields.' });
  }

  const newBlog = {
    id: blogIdCounter++,
    title,
    author,
    content,
    category,
    timestamp: new Date().toISOString()
  };

  blogs.unshift(newBlog);
  // persist blogs
  safeSave('blogs.json', blogs);
  res.status(201).json({ message: 'Blog published successfully!', blog: newBlog });
});

app.delete('/api/blogs/:id', (req, res) => {
  const blogId = Number(req.params.id);
  const index = blogs.findIndex((blog) => blog.id === blogId);

  if (index === -1) {
    return res.status(404).json({ message: 'Blog not found.' });
  }

  blogs.splice(index, 1);
  res.json({ message: 'Blog deleted successfully.' });
});

app.post('/api/sells', upload.single('photo'), (req, res) => {
  const { name, phone, email, appliance, model, condition, price } = req.body;

  if (!name || !phone || !email || !appliance || !model || !condition || !price) {
    return res.status(400).json({ message: 'Please fill all sell request fields.' });
  }

  const newSell = {
    id: sellIdCounter++,
    name,
    phone,
    email,
    appliance,
    model,
    condition,
    price,
    photoName: req.file ? req.file.originalname : 'No photo uploaded',
    createdAt: new Date().toISOString()
  };

  sells.unshift(newSell);
  // persist sells
  safeSave('sells.json', sells);
  res.status(201).json({ message: 'Sell request submitted successfully!', sell: newSell });
});

const orders = safeLoad('orders.json', []);
let orderIdCounter = orders.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1;

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { items, total } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart cannot be empty.' });
  }

  if (typeof total !== 'number' || Number.isNaN(total) || total <= 0) {
    return res.status(400).json({ message: 'Invalid total amount.' });
  }

  const newOrder = {
    id: orderIdCounter++,
    items,
    total,
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  // persist orders
  safeSave('orders.json', orders);
  res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json(serverSettings);
});

app.post('/api/settings', (req, res) => {
  const payload = req.body || {};
  // Basic validation / sanitize
  serverSettings = Object.assign(serverSettings, {
    adminName: typeof payload.adminName === 'string' ? payload.adminName : serverSettings.adminName,
    adminEmail: typeof payload.adminEmail === 'string' ? payload.adminEmail : serverSettings.adminEmail,
    darkMode: !!payload.darkMode,
    emailNotifications: !!payload.emailNotifications,
    defaultView: typeof payload.defaultView === 'string' ? payload.defaultView : serverSettings.defaultView,
  });
  // persist server settings
  try {
    safeSave('settings.json', serverSettings);
  } catch (e) {
    console.warn('Failed to persist settings', e);
  }
  res.json({ message: 'Settings saved on server', settings: serverSettings });
});

const PORT = process.env.PORT || 5000;
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Elite Repair API running on http://localhost:${PORT}`);
  });
}
