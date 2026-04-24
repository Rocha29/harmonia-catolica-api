import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ──────────────────────────────────────────────────────────
//  Helpers de calendário litúrgico
// ──────────────────────────────────────────────────────────

/** Calcula a data da Páscoa (algoritmo de Butcher/Meeus) */
function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function addDias(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

interface InfoLiturgica {
  titulo: string;
  tempo: string;
  cor: string;
  ciclo: string;
  domingo: number;
}

function calcularInfoLiturgica(data: Date): InfoLiturgica {
  const ano = data.getFullYear();
  const pascoa = calcularPascoa(ano);

  // Limites de cada tempo
  const quaresmaInicio = addDias(pascoa, -46);  // Quarta-feira de Cinzas
  const parabensInicio = addDias(pascoa, 0);
  const ascensao       = addDias(pascoa, 39);
  const pentecostes    = addDias(pascoa, 49);
  const advento1       = (() => {
    // 1º Domingo do Advento: 4º domingo antes do Natal
    const natal = new Date(ano, 11, 25);
    const diaSemana = natal.getDay(); // 0=Dom
    const diasAteAdv = diaSemana === 0 ? 28 : 28 - diaSemana + (diaSemana > 0 ? 0 : 0);
    return addDias(natal, -(diaSemana === 0 ? 28 : 28 - diaSemana));
  })();
  const natal = new Date(ano, 11, 25);
  const advento1AnoAnterior = (() => {
    const natalAnt = new Date(ano - 1, 11, 25);
    const dw = natalAnt.getDay();
    return addDias(natalAnt, -(dw === 0 ? 28 : 28 - dw));
  })();

  // Ciclo litúrgico (A/B/C — baseado no ano litúrgico que começa no Advento)
  // Ciclo B: 2026–2027, Ciclo C: 2027–2028, Ciclo A: 2025–2026
  const anoLiturgico = data >= advento1 ? ano + 1 : ano;
  const ciclos = ['B', 'C', 'A'];
  const ciclo = ciclos[(anoLiturgico - 2026) % 3] ?? 'B';

  // Determinar tempo litúrgico
  let tempo = 'Tempo Comum';
  let cor = 'verde';
  let titulo = 'Tempo Comum';
  let domingo = 1;

  if (data >= quaresmaInicio && data < parabensInicio) {
    tempo = 'Quaresma';
    cor = 'roxo';
    const semana = Math.ceil((data.getTime() - quaresmaInicio.getTime()) / (7 * 86400000));
    domingo = semana;
    titulo = `${semana}ª Semana da Quaresma`;
  } else if (mesmoDia(data, pascoa)) {
    tempo = 'Páscoa';
    cor = 'branco';
    titulo = 'Domingo de Páscoa';
    domingo = 1;
  } else if (data >= parabensInicio && data < pentecostes) {
    tempo = 'Tempo Pascal';
    cor = 'branco';
    const semana = Math.ceil((data.getTime() - parabensInicio.getTime()) / (7 * 86400000)) + 1;
    domingo = semana;
    titulo = `${semana}º Domingo do Tempo Pascal`;
  } else if (mesmoDia(data, pentecostes)) {
    tempo = 'Pentecostes';
    cor = 'vermelho';
    titulo = 'Domingo de Pentecostes';
    domingo = 7;
  } else if (data >= advento1 || data < advento1AnoAnterior) {
    tempo = 'Advento';
    cor = 'roxo';
    const base = data >= advento1 ? advento1 : advento1AnoAnterior;
    const semana = Math.min(4, Math.ceil((data.getTime() - base.getTime()) / (7 * 86400000)) + 1);
    domingo = semana;
    titulo = `${semana}º Domingo do Advento`;
  } else if (data >= natal && data < advento1) {
    tempo = 'Natal';
    cor = 'branco';
    titulo = 'Tempo do Natal';
    domingo = 1;
  } else {
    // Tempo Comum — calcular qual domingo
    const fimPascal = pentecostes;
    const diffMs = data.getTime() - fimPascal.getTime();
    domingo = Math.ceil(diffMs / (7 * 86400000)) + 8;
    titulo = `${domingo}º Domingo do Tempo Comum`;
  }

  // Festas fixas que mudam a cor
  const mes = data.getMonth() + 1;
  const dia = data.getDate();
  if (mes === 11 && dia === 1)  { titulo = 'Todos os Santos';      cor = 'branco'; }
  if (mes === 11 && dia === 2)  { titulo = 'Finados';              cor = 'preto';  }
  if (mes === 12 && dia === 8)  { titulo = 'Imaculada Conceição';  cor = 'branco'; }
  if (mes === 12 && dia === 25) { titulo = 'Natal do Senhor';      cor = 'branco'; tempo = 'Natal'; }
  if (mes === 1  && dia === 1)  { titulo = 'Solenidade de Maria';  cor = 'branco'; }
  if (mes === 6  && dia === 29) { titulo = 'SS. Pedro e Paulo';    cor = 'vermelho'; }
  if (mes === 8  && dia === 15) { titulo = 'Assunção de Maria';    cor = 'branco'; }

  return { titulo, tempo, cor, ciclo, domingo };
}

// ──────────────────────────────────────────────────────────
//  Evangelizo API — fallback para evangelho do dia
// ──────────────────────────────────────────────────────────

interface EvangelizoResponse {
  day?: string;
  title?: string;
  short_text?: string;
  long_text?: string;
  ref?: string;
  reading_label?: string;
}

async function buscarEvangelizoDia(data: Date): Promise<{ evangelho: string; titulo: string } | null> {
  try {
    const ano  = data.getFullYear();
    const mes  = String(data.getMonth() + 1).padStart(2, '0');
    const dia  = String(data.getDate()).padStart(2, '0');
    const url  = `https://evangelizo.org/api/evangelio_json/PT/${ano}${mes}${dia}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;

    const json = await resp.json() as EvangelizoResponse;
    const ref  = json.ref ?? json.reading_label ?? '';
    const text = json.short_text ?? json.long_text ?? '';
    const tituloExt = json.title ?? '';

    return {
      evangelho: ref ? `${ref}\n\n${text}`.trim() : text,
      titulo: tituloExt,
    };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────
//  Função principal: buscar/criar dia litúrgico
// ──────────────────────────────────────────────────────────

async function obterDiaLiturgico(dataISO: string) {
  const dataObj = new Date(dataISO + 'T12:00:00');
  if (isNaN(dataObj.getTime())) return null;

  // 1. Tenta banco local
  const local = await prisma.diaLiturgico.findUnique({ where: { data: dataObj } });
  if (local) return local;

  // 2. Computa info litúrgica localmente
  const info = calcularInfoLiturgica(dataObj);

  // 3. Busca evangelho na API Evangelizo (best-effort)
  const evangelizo = await buscarEvangelizoDia(dataObj);

  const titulo = evangelizo?.titulo && evangelizo.titulo.length > 3
    ? evangelizo.titulo
    : info.titulo;

  // 4. Salva no banco para cache
  const novo = await prisma.diaLiturgico.create({
    data: {
      data:      dataObj,
      ciclo:     info.ciclo,
      tempo:     info.tempo,
      domingo:   info.domingo,
      festa:     titulo,
      graue:     info.cor,
      evangelho: evangelizo?.evangelho ?? null,
    },
  });

  return novo;
}

// ──────────────────────────────────────────────────────────
//  Rotas
// ──────────────────────────────────────────────────────────

// GET /api/calendario — lista por mês/ano
router.get('/', async (req, res) => {
  try {
    const { mes, ano, ciclo, tempo } = req.query;
    let where: any = {};

    if (mes && ano) {
      const inicio = new Date(Number(ano), Number(mes) - 1, 1);
      const fim    = new Date(Number(ano), Number(mes), 0);
      where.data = { gte: inicio, lte: fim };
    }
    if (ciclo) where.ciclo = ciclo;
    if (tempo) where.tempo = tempo;

    const dias = await prisma.diaLiturgico.findMany({ where, orderBy: { data: 'asc' } });
    res.json({ success: true, count: dias.length, dados: dias });
  } catch (error) {
    res.status(500).json({ success: false, erro: 'Erro ao listar calendário' });
  }
});

// GET /api/calendario/dia/:data — dia específico (YYYY-MM-DD) com fallback Evangelizo
router.get('/dia/:data', async (req, res) => {
  try {
    const dia = await obterDiaLiturgico(req.params.data as string);
    if (!dia) {
      return res.status(400).json({ success: false, erro: 'Data inválida. Use YYYY-MM-DD' });
    }
    res.json({ success: true, dados: dia });
  } catch (error) {
    console.error('Erro ao buscar dia litúrgico:', error);
    res.status(500).json({ success: false, erro: 'Erro ao buscar dia litúrgico' });
  }
});

// GET /api/calendario/proximos/semana — próximos 7 dias com fallback Evangelizo
router.get('/proximos/semana', async (req, res) => {
  try {
    const hoje = new Date();
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = addDias(hoje, i);
      const iso = d.toISOString().split('T')[0];
      const dia = await obterDiaLiturgico(iso);
      if (dia) dias.push(dia);
    }
    res.json({ success: true, count: dias.length, dados: dias });
  } catch (error) {
    res.status(500).json({ success: false, erro: 'Erro ao listar próximos dias' });
  }
});

// GET /api/calendario/ciclos/listar
router.get('/ciclos/listar', async (_req, res) => {
  try {
    const ciclos = await prisma.diaLiturgico.findMany({ distinct: ['ciclo'], select: { ciclo: true } });
    res.json({ success: true, ciclos: ciclos.map(c => c.ciclo).filter(Boolean).sort() });
  } catch {
    res.status(500).json({ success: false, erro: 'Erro ao listar ciclos' });
  }
});

// GET /api/calendario/tempos/listar
router.get('/tempos/listar', async (_req, res) => {
  try {
    const tempos = await prisma.diaLiturgico.findMany({ distinct: ['tempo'], select: { tempo: true } });
    res.json({ success: true, tempos: tempos.map(t => t.tempo).filter(Boolean).sort() });
  } catch {
    res.status(500).json({ success: false, erro: 'Erro ao listar tempos' });
  }
});

export default router;
