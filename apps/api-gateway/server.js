import express from 'express';
import fetch from 'node-fetch';
import * as failureflags from '@gremlin/failure-flags';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const ENABLED = (process.env.FAILURE_FLAGS_ENABLED || '').toLowerCase() === 'true';

app.get('/salud', (_req, res) => res.json({ ok: true, servicio: 'api-gateway' }));

app.post('/pagar', async (req, res) => {
  const amount = Number(req.body?.amount ?? 0);
  const start = Date.now();
  try {
    // Failure Flag alrededor de la llamada a B
    if (ENABLED) {
      await failureflags.invokeFailureFlag({
        name: 'call-b',
        labels: { path: '/pagar', method: 'POST' }
      });
    }

    const resp = await fetch(`${BACKEND_URL}/charge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const data = await resp.json();
    const ms = Date.now() - start;
    res.status(resp.status).json({ via: 'gateway', backend: data, latency_ms: ms });
  } catch (err) {
    const ms = Date.now() - start;
    res.status(502).json({ via: 'gateway', error: String(err), latency_ms: ms });
  }
});

app.listen(PORT, () => {
  console.log(`api-gateway escuchando en :${PORT}, BACKEND_URL=${BACKEND_URL}, FAILURE_FLAGS_ENABLED=${ENABLED}`);
});
