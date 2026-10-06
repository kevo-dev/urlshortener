require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const validURL = require('valid-url');
const shortID = require('shortid');

const app = express();
const port = Number(process.env.PORT) || 3000;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required.');
  process.exit(1);
}

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(process.cwd() + '/public'));

const urlSchema = new mongoose.Schema({
  originalURL: { type: String, required: true, trim: true },
  shortURL: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

const URL = mongoose.model('URL', urlSchema);

app.get('/', (_req, res) => res.sendFile(process.cwd() + '/views/index.html'));

app.get('/health', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'degraded', service: 'fupisha-url-shortener', database: ready ? 'connected' : 'disconnected' });
});

app.post('/api/shorturl/new', async (req, res) => {
  const originalURL = typeof req.body.url === 'string' ? req.body.url.trim() : '';
  if (!originalURL || !validURL.isWebUri(originalURL)) return res.status(400).json({ error: 'invalid url' });

  try {
    const existing = await URL.findOne({ originalURL }).lean();
    if (existing) return res.json({ original_url: existing.originalURL, short_url: existing.shortURL });

    const created = await URL.create({ originalURL, shortURL: shortID.generate() });
    return res.status(201).json({ original_url: created.originalURL, short_url: created.shortURL });
  } catch (error) {
    if (error && error.code === 11000) {
      const existing = await URL.findOne({ originalURL }).lean();
      if (existing) return res.json({ original_url: existing.originalURL, short_url: existing.shortURL });
    }
    console.error('Create short URL failed:', error);
    return res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/shorturl/:shortURL', async (req, res) => {
  const code = typeof req.params.shortURL === 'string' ? req.params.shortURL.trim() : '';
  if (!code) return res.status(400).json({ error: 'short url is required' });
  try {
    const record = await URL.findOne({ shortURL: code }).lean();
    if (!record) return res.status(404).json({ error: 'url not found' });
    return res.redirect(record.originalURL);
  } catch (error) {
    console.error('Redirect lookup failed:', error);
    return res.status(500).json({ error: 'server error' });
  }
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'route not found' });
  return res.status(404).send('Not found');
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(port, () => console.log('Fupisha listening on port ' + port));
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

start();
