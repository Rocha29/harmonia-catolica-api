import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Calcula pontos de um ministério dinamicamente:
// setlists públicos × 10 + vídeos × 20 + eventos × 5 + amens × 2
function calcularPontos(ministerio: any): number {
  const pts =
    (ministerio._count?.videos ?? 0) * 20 +
    (ministerio._count?.eventos ?? 0) * 5 +
    (ministerio.videos?.reduce((sum: number, v: any) => sum + (v._count?.amens ?? 0), 0) ?? 0) * 2;
  return pts;
}

// GET /api/ministerios/ranking — top 10 por pontuação (público)
router.get('/ranking', async (req: any, res: any) => {
  const ministerios = await prisma.ministerio.findMany({
    where: { ativo: true },
    include: {
      _count: { select: { videos: true, eventos: true } },
      videos: { include: { _count: { select: { amens: true } } } },
      usuario: { select: { nome: true } },
    },
  });

  const ranked = ministerios
    .map(m => ({ ...m, pontos: calcularPontos(m) }))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 10)
    .map((m, i) => ({ ...m, ranking: i + 1 }));

  res.json({ success: true, dados: ranked });
});

// GET /api/ministerios — todos os meus ministérios
router.get('/', verificarAuth, async (req: any, res: any) => {
  const ministerios = await prisma.ministerio.findMany({
    where: { usuarioId: req.usuarioId },
    include: {
      _count: { select: { videos: true, eventos: true } },
      eventos: { orderBy: { data: 'asc' }, take: 5 },
      videos: { orderBy: { criadoEm: 'desc' }, take: 3 },
    },
    orderBy: { criadoEm: 'desc' },
  });
  res.json({ success: true, dados: ministerios });
});

// GET /api/ministerios/todos — listagem pública com ranking
router.get('/todos', async (req: any, res: any) => {
  const ministerios = await prisma.ministerio.findMany({
    where: { ativo: true },
    include: {
      _count: { select: { videos: true, eventos: true } },
      videos: {
        include: { _count: { select: { amens: true } } },
        orderBy: { criadoEm: 'desc' },
      },
      eventos: {
        where: { data: { gte: new Date() } },
        orderBy: { data: 'asc' },
        take: 3,
      },
      usuario: { select: { nome: true } },
    },
  });

  const ranked = ministerios
    .map(m => ({ ...m, pontos: calcularPontos(m) }))
    .sort((a, b) => b.pontos - a.pontos)
    .map((m, i) => ({ ...m, ranking: i + 1 }));

  res.json({ success: true, dados: ranked });
});

// GET /api/ministerios/eventos-proximos — próximos eventos de todos os ministérios
router.get('/eventos-proximos', async (req: any, res: any) => {
  const eventos = await prisma.ministerioEvento.findMany({
    where: { data: { gte: new Date() } },
    include: {
      ministerio: { select: { nome: true, paroquia: true } },
    },
    orderBy: { data: 'asc' },
    take: 10,
  });
  res.json({ success: true, dados: eventos });
});

// GET /api/ministerios/:id
router.get('/:id', async (req: any, res: any) => {
  const ministerio = await prisma.ministerio.findFirst({
    where: { id: req.params.id, ativo: true },
    include: {
      eventos: { orderBy: { data: 'asc' } },
      videos: {
        include: { _count: { select: { amens: true } } },
        orderBy: { criadoEm: 'desc' },
      },
      usuario: { select: { nome: true } },
    },
  });
  if (!ministerio) return res.status(404).json({ success: false, erro: 'Ministério não encontrado' });
  res.json({ success: true, dados: { ...ministerio, pontos: calcularPontos(ministerio) } });
});

// POST /api/ministerios
router.post('/', verificarAuth, async (req: any, res: any) => {
  const { nome, paroquia, cidade, estado, descricao } = req.body;
  if (!nome || !paroquia) return res.status(400).json({ success: false, erro: 'nome e paroquia são obrigatórios' });

  const ministerio = await prisma.ministerio.create({
    data: { nome, paroquia, cidade, estado, descricao, usuarioId: req.usuarioId },
  });
  res.status(201).json({ success: true, dados: ministerio });
});

// PUT /api/ministerios/:id
router.put('/:id', verificarAuth, async (req: any, res: any) => {
  const existente = await prisma.ministerio.findFirst({ where: { id: req.params.id, usuarioId: req.usuarioId } });
  if (!existente) return res.status(404).json({ success: false, erro: 'Não encontrado ou sem permissão' });

  const { nome, paroquia, cidade, estado, descricao } = req.body;
  const atualizado = await prisma.ministerio.update({
    where: { id: req.params.id },
    data: { nome, paroquia, cidade, estado, descricao },
  });
  res.json({ success: true, dados: atualizado });
});

// DELETE /api/ministerios/:id
router.delete('/:id', verificarAuth, async (req: any, res: any) => {
  const existente = await prisma.ministerio.findFirst({ where: { id: req.params.id, usuarioId: req.usuarioId } });
  if (!existente) return res.status(404).json({ success: false, erro: 'Não encontrado ou sem permissão' });
  await prisma.ministerio.update({ where: { id: req.params.id }, data: { ativo: false } });
  res.json({ success: true });
});

// ---- EVENTOS ----

// POST /api/ministerios/:id/eventos
router.post('/:id/eventos', verificarAuth, async (req: any, res: any) => {
  const ministerio = await prisma.ministerio.findFirst({ where: { id: req.params.id, usuarioId: req.usuarioId } });
  if (!ministerio) return res.status(404).json({ success: false, erro: 'Ministério não encontrado' });

  const { titulo, data, local, descricao } = req.body;
  if (!titulo || !data) return res.status(400).json({ success: false, erro: 'titulo e data são obrigatórios' });

  const evento = await prisma.ministerioEvento.create({
    data: { ministerioId: req.params.id, titulo, data: new Date(data), local, descricao },
  });
  res.status(201).json({ success: true, dados: evento });
});

// DELETE /api/ministerios/:id/eventos/:eventoId
router.delete('/:id/eventos/:eventoId', verificarAuth, async (req: any, res: any) => {
  const ministerio = await prisma.ministerio.findFirst({ where: { id: req.params.id, usuarioId: req.usuarioId } });
  if (!ministerio) return res.status(404).json({ success: false, erro: 'Sem permissão' });
  await prisma.ministerioEvento.delete({ where: { id: req.params.eventoId } });
  res.json({ success: true });
});

// ---- VÍDEOS ----

// POST /api/ministerios/:id/videos
router.post('/:id/videos', verificarAuth, async (req: any, res: any) => {
  const ministerio = await prisma.ministerio.findFirst({ where: { id: req.params.id, usuarioId: req.usuarioId } });
  if (!ministerio) return res.status(404).json({ success: false, erro: 'Ministério não encontrado' });

  const { url, titulo } = req.body;
  if (!url || !titulo) return res.status(400).json({ success: false, erro: 'url e titulo são obrigatórios' });

  const video = await prisma.ministerioVideo.create({
    data: { ministerioId: req.params.id, url, titulo },
  });
  res.status(201).json({ success: true, dados: video });
});

// DELETE /api/ministerios/:id/videos/:videoId
router.delete('/:id/videos/:videoId', verificarAuth, async (req: any, res: any) => {
  const ministerio = await prisma.ministerio.findFirst({ where: { id: req.params.id, usuarioId: req.usuarioId } });
  if (!ministerio) return res.status(404).json({ success: false, erro: 'Sem permissão' });
  await prisma.ministerioVideo.delete({ where: { id: req.params.videoId } });
  res.json({ success: true });
});

// POST /api/ministerios/:id/videos/:videoId/amem — dar/tirar amém
router.post('/:id/videos/:videoId/amem', verificarAuth, async (req: any, res: any) => {
  const existente = await prisma.ministerioVideoAmem.findUnique({
    where: { videoId_usuarioId: { videoId: req.params.videoId, usuarioId: req.usuarioId } },
  });

  if (existente) {
    await prisma.ministerioVideoAmem.delete({ where: { id: existente.id } });
    res.json({ success: true, amem: false });
  } else {
    await prisma.ministerioVideoAmem.create({
      data: { videoId: req.params.videoId, usuarioId: req.usuarioId },
    });
    res.json({ success: true, amem: true });
  }
});

export default router;
