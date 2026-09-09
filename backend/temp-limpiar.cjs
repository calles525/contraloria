const path = require('path');

(async () => {
  const base = 'http://localhost:3030/api';
  const login = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'jesus', password: '123' }),
  });
  const { token } = await login.json();
  const h = { Authorization: 'Bearer ' + token };

  const lista = await fetch(base + '/warehouses', { headers: h });
  const { data } = await lista.json();
  for (const w of data) {
    if (String(w.code).startsWith('ALM-PRUEBA')) {
      const r = await fetch(base + '/warehouses/' + w.id, { method: 'DELETE', headers: h });
      console.log('eliminado', w.code, '->', r.status);
    }
  }
  const final = await fetch(base + '/warehouses', { headers: h });
  console.log('almacenes totales ahora:', (await final.json()).data.length);
})().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});