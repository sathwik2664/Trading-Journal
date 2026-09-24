// Usage:  node scripts/compressExistingImages.js --dry   (report only)
//         node scripts/compressExistingImages.js         (actually compress)
require('dotenv').config();
const mongoose  = require('mongoose');
const sharp     = require('sharp');
const connectDB = require('../config/db');
const Trade     = require('../models/Trade');

const DRY = process.argv.includes('--dry');
const MAX_W = 1600, QUALITY = 80, MIN_BYTES = 300 * 1024;

const shrink = async (dataUrl) => {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;
  const input = Buffer.from(dataUrl.split(',')[1] || '', 'base64');
  if (input.length < MIN_BYTES) return null;
  const out = await sharp(input)
    .rotate()
    .resize({ width: MAX_W, withoutEnlargement: true })
    .jpeg({ quality: QUALITY })
    .toBuffer();
  if (out.length >= input.length) return null;
  return { src: `data:image/jpeg;base64,${out.toString('base64')}`, before: input.length, after: out.length };
};

(async () => {
  await connectDB();
  const ids = await Trade.find().select('_id').lean();
  let saved = 0, touched = 0;

  for (const { _id } of ids) {
    const t = await Trade.findById(_id).select('screenshot images').lean();
    const $set = {};

    const s = await shrink(t.screenshot);
    if (s) { $set.screenshot = s.src; saved += s.before - s.after; }

    if (t.images?.length) {
      let changed = false;
      const imgs = [];
      for (const img of t.images) {
        const r = await shrink(img.src);
        if (r) { imgs.push({ ...img, src: r.src }); saved += r.before - r.after; changed = true; }
        else imgs.push(img);
      }
      if (changed) $set.images = imgs;
    }

    if (Object.keys($set).length) {
      touched++;
      if (!DRY) await Trade.updateOne({ _id }, { $set });
      console.log(`${DRY ? '[dry] ' : ''}trade ${_id} shrunk`);
    }
  }

  console.log(`\n${DRY ? 'Would update' : 'Updated'} ${touched} trades, saving ~${(saved / 1024 / 1024).toFixed(1)} MB`);
  await mongoose.connection.close();
})();