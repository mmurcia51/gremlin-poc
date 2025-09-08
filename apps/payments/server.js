import express from 'express';
import * as failureflags from '@gremlin/failure-flags';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;
const ENABLED = (process.env.FAILURE_FLAGS_ENABLED || '').toLowerCase() === 'true';

// Pseudo-DB simple
const ledger = []; // [{amount, ts}]
function fakeDbInsert(amount) {
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true, id: ledger.length + 1 }), 50));
}

app.get('/salud', (_req, res) => res.json({ ok: true, servicio: 'payments' }));

app.post('/charge', async (req, res) => {
  const amount = Number(req.body?.amount ?? 0);
  const start = Date.now();
  try {
    if (ENABLED) {
      // Bandera alrededor del handler general
      await failureflags.invokeFailureFlag({
        name: 'payments-handler',
        labels: { path: '/charge', method: 'POST' }
      });
    }

    // "Consulta a BD" simulada con otra bandera
    if (ENABLED) {
      await failureflags.invokeFailureFlag({
        name: 'db-query',
        labels: { table: 'payments', op: 'insert' }
      });
    }

    const ins = await fakeDbInsert(amount);
    ledger.push({ amount, ts: Date.now() });
    const ms = Date.now() - start;
    res.json({ ok: true, charged: amount, ref: ins.id, latency_ms: ms });
  } catch (err) {
    const ms = Date.now() - start;
    res.status(500).json({ ok: false, error: String(err), latency_ms: ms });
  }
});

app.listen(PORT, () => {
  console.log(`payments escuchando en :${PORT}, FAILURE_FLAGS_ENABLED=${ENABLED}`);
});
