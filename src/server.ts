const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth').default;
const calendarioRouter = require('./routes/calendario').default;
const cantosRouter = require('./routes/cantos').default;
const setlistsRouter = require('./routes/setlists').default;
const ministeriosRouter = require('./routes/ministerios').default;
const leiturasRouter    = require('./routes/leituras').default;

app.use('/api/auth', authRouter);
app.use('/api/calendario', calendarioRouter);
app.use('/api/cantos', cantosRouter);
app.use('/api/setlists', setlistsRouter);
app.use('/api/ministerios', ministeriosRouter);
app.use('/api/leituras', leiturasRouter);

// Health check endpoint
app.get('/api/health', (req: any, res: any) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'ready',
  });
});

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`✅ Server rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login (POST)`);
  console.log(`🎵 Harmonia Católica Backend - PHASE 1`);
});
