const express      = require('express');
const cors         = require('cors');
const dotenv       = require('dotenv');
const path         = require('path');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// ⚠️ Increase limit to handle base64 screenshots
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',      require('./routes/auth'));              // ← ADDED
app.use('/api/trades',    require('./routes/trades'));
app.use('/api/notes',     require('./routes/notes'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/checklist', require('./routes/preMarketChecklistRoutes'));
app.use('/api/account',   require('./routes/account'));
app.use('/api/setups',    require('./routes/setups'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});