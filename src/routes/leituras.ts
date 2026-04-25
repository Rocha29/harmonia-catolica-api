import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const LITURGIA_API = 'https://liturgia.up.railway.app';

// GET /api/leituras/:data  (YYYY-MM-DD)
router.get('/:data', async (req, res) => {
  const dataISO = String(req.params.data);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
    return res.status(400).json({ success: false, erro: 'Data inválida. Use YYYY-MM-DD' });
  }

  const [ano, mes, dia] = dataISO.split('-');
  const dataObj = new Date(`${dataISO}T12:00:00`);

  // 1. Verifica cache no banco (leitura1 preenchida = já processado)
  const cached = await prisma.diaLiturgico.findUnique({ where: { data: dataObj } });
  if (cached?.leitura1) {
    return res.json({
      success: true,
      fonte: 'cache',
      dados: {
        liturgia:   cached.festa   ?? '',
        cor:        cached.graue   ?? '',
        leitura1:   { ref: '', texto: cached.leitura1 },
        salmo:      { ref: '', refrao: '', texto: cached.salmo ?? '' },
        leitura2:   cached.leitura2 ? { ref: '', texto: cached.leitura2 } : undefined,
        evangelho:  { ref: '', texto: cached.evangelho ?? '' },
      },
    });
  }

  // 2. Busca na API v3
  const url = `${LITURGIA_API}/v3/?dia=${dia}&mes=${mes}&ano=${ano}`;
  let apiData: any;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    apiData = await resp.json();
  } catch (err) {
    return res.status(502).json({ success: false, erro: 'API de liturgia indisponível', detalhe: String(err) });
  }

  // 3. Extrai a celebração principal (principal: true, ou a primeira)
  const celebracoes: any[] = apiData?.celebracoes ?? [];
  const cel = celebracoes.find((c: any) => c.principal) ?? celebracoes[0];
  if (!cel) {
    return res.json({ success: true, fonte: 'api', dados: null });
  }

  // 4. Mapeia leituras por tipo
  const leituras: any[] = cel.leituras ?? [];
  function getLeitura(tipo: string) {
    return leituras.find((l: any) => l.tipo === tipo);
  }

  const l1 = getLeitura('leitura');
  const l2 = leituras.filter((l: any) => l.tipo === 'leitura')[1];
  const salmo = getLeitura('salmo');
  const ev = getLeitura('evangelho');

  function opcao(l: any) { return l?.opcoes?.[0] ?? null; }

  const o1   = opcao(l1);
  const o2   = opcao(l2);
  const oSal = opcao(salmo);
  const oEv  = opcao(ev);

  const dados = {
    liturgia:  cel.liturgia ?? '',
    cor:       cel.cor      ?? '',
    leitura1:  o1  ? { ref: o1.referencia,  texto: o1.texto  } : null,
    salmo:     oSal ? { ref: oSal.referencia, refrao: oSal.refrao ?? '', texto: oSal.texto } : null,
    leitura2:  o2  ? { ref: o2.referencia,  texto: o2.texto  } : undefined,
    evangelho: oEv ? { ref: oEv.referencia, texto: oEv.texto } : null,
  };

  // 5. Persiste no banco para cache futuro
  if (dados.leitura1) {
    try {
      await prisma.diaLiturgico.upsert({
        where:  { data: dataObj },
        update: {
          festa:     dados.liturgia,
          graue:     dados.cor,
          leitura1:  dados.leitura1.texto,
          salmo:     dados.salmo?.texto ?? null,
          leitura2:  dados.leitura2?.texto ?? null,
          evangelho: dados.evangelho?.texto ?? null,
        },
        create: {
          data:      dataObj,
          ciclo:     '',
          tempo:     '',
          domingo:   0,
          festa:     dados.liturgia,
          graue:     dados.cor,
          leitura1:  dados.leitura1.texto,
          salmo:     dados.salmo?.texto ?? null,
          leitura2:  dados.leitura2?.texto ?? null,
          evangelho: dados.evangelho?.texto ?? null,
        },
      });
    } catch { /* cache opcional */ }
  }

  return res.json({ success: true, fonte: 'api', dados });
});

export default router;
