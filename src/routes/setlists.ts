import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { verificarAuth } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Gerar link público único
function gerarLinkPublico(): string {
  return crypto.randomBytes(12).toString('hex');
}

// POST /api/setlists - Criar nova setlist
router.post('/', verificarAuth, async (req: any, res: any) => {
  try {
    const {
      titulo,
      data,
      estilo,
      grupoId,
    } = req.body;

    // Validações
    if (!titulo || !data || !estilo) {
      return res.status(400).json({
        success: false,
        erro: 'Campos obrigatórios: titulo, data, estilo',
      });
    }

    if (!['solene', 'carismatico'].includes(estilo)) {
      return res.status(400).json({
        success: false,
        erro: 'Estilo deve ser "solene" ou "carismatico"',
      });
    }

    const setlist = await prisma.setlist.create({
      data: {
        titulo,
        data: new Date(data),
        estilo,
        duracao: 0,
        usuarioId: req.usuarioId,
        grupoId: grupoId || null,
        linkPublico: gerarLinkPublico(),
      },
      include: {
        cantos: {
          include: { canto: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    res.status(201).json({
      success: true,
      mensagem: 'Setlist criada com sucesso',
      dados: setlist,
    });
  } catch (error) {
    console.error('Erro ao criar setlist:', error);
    res.status(500).json({ success: false, erro: 'Erro ao criar setlist' });
  }
});

// GET /api/setlists/:id - Obter setlist por ID (com cantos)
// GET /api/setlists/publica/:linkPublico - deve vir ANTES de /:id
router.get('/publica/:linkPublico', async (req, res) => {
  try {
    const { linkPublico } = req.params;

    const setlist = await prisma.setlist.findUnique({
      where: { linkPublico },
      include: {
        usuario: { select: { id: true, nome: true } },
        cantos: {
          include: { canto: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!setlist) {
      return res.status(404).json({ success: false, erro: 'Setlist pública não encontrada' });
    }

    res.json({
      success: true,
      dados: setlist,
      linkWhatsApp: `https://wa.me/?text=${encodeURIComponent(`Confira esta Setlist: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/setlists/publica/${linkPublico}`)}`,
    });
  } catch (error) {
    console.error('Erro ao acessar setlist pública:', error);
    res.status(500).json({ success: false, erro: 'Erro ao acessar setlist' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        grupo: { select: { id: true, nome: true } },
        cantos: {
          include: {
            canto: {
              select: {
                id: true, titulo: true, compositor: true, estilo: true,
                tom: true, duracao: true, letra: true, cifra: true, momentoMissa: true,
              },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!setlist) {
      return res.status(404).json({ success: false, erro: 'Setlist não encontrada' });
    }

    res.json({ success: true, dados: setlist });
  } catch (error) {
    console.error('Erro ao buscar setlist:', error);
    res.status(500).json({ success: false, erro: 'Erro ao buscar setlist' });
  }
});

// PUT /api/setlists/:id - Atualizar setlist
router.put('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, data, estilo, notas } = req.body;

    const setlistExistente = await prisma.setlist.findUnique({
      where: { id },
    });

    if (!setlistExistente) {
      return res.status(404).json({
        success: false,
        erro: 'Setlist não encontrada',
      });
    }

    const updateData: any = {};
    if (titulo) updateData.titulo = titulo;
    if (data) updateData.data = new Date(data);
    if (estilo) updateData.estilo = estilo;
    if (notas !== undefined) updateData.notas = notas;

    const setlist = await prisma.setlist.update({
      where: { id },
      data: updateData,
      include: {
        cantos: {
          include: { canto: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      mensagem: 'Setlist atualizada com sucesso',
      dados: setlist,
    });
  } catch (error) {
    console.error('Erro ao atualizar setlist:', error);
    res.status(500).json({ success: false, erro: 'Erro ao atualizar setlist' });
  }
});

// DELETE /api/setlists/:id - Deletar setlist
router.delete('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const setlistExistente = await prisma.setlist.findUnique({
      where: { id },
    });

    if (!setlistExistente) {
      return res.status(404).json({
        success: false,
        erro: 'Setlist não encontrada',
      });
    }

    // Deletar cantos da setlist (auto-cascade pela config do banco)
    await prisma.setlistCanto.deleteMany({
      where: { setlistId: id },
    });

    // Deletar setlist
    await prisma.setlist.delete({
      where: { id },
    });

    res.json({
      success: true,
      mensagem: 'Setlist deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar setlist:', error);
    res.status(500).json({ success: false, erro: 'Erro ao deletar setlist' });
  }
});

// POST /api/setlists/:id/cantos - Adicionar canto à setlist
router.post('/:id/cantos', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { cantoId, tom, notas, ordem } = req.body;

    if (!cantoId) {
      return res.status(400).json({
        success: false,
        erro: 'cantoId é obrigatório',
      });
    }

    // Validar que setlist existe
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: { cantos: { select: { ordem: true } } },
    });

    if (!setlist) {
      return res.status(404).json({
        success: false,
        erro: 'Setlist não encontrada',
      });
    }

    // Validar que canto existe
    const canto = await prisma.canto.findUnique({
      where: { id: cantoId },
    });

    if (!canto) {
      return res.status(404).json({
        success: false,
        erro: 'Canto não encontrado',
      });
    }

    // Calcular próxima ordem se não fornecida
    const proximaOrdem = ordem || (setlist.cantos.length > 0
      ? Math.max(...setlist.cantos.map(c => c.ordem)) + 1
      : 1);

    const setlistCanto = await prisma.setlistCanto.create({
      data: {
        setlistId: id,
        cantoId,
        ordem: proximaOrdem,
        tom: tom || canto.tom,
        notas: notas || null,
      },
      include: { canto: true },
    });

    // Recalcular duração total
    const novosDados = await prisma.setlist.findUnique({
      where: { id },
      include: { cantos: { include: { canto: true } } },
    });

    const novasDuracao = novosDados!.cantos.reduce(
      (sum, sc) => sum + (sc.canto.duracao || 0),
      0
    );

    await prisma.setlist.update({
      where: { id },
      data: { duracao: novasDuracao },
    });

    res.status(201).json({
      success: true,
      mensagem: 'Canto adicionado à setlist',
      dados: setlistCanto,
      duracaoTotal: novasDuracao,
    });
  } catch (error) {
    console.error('Erro ao adicionar canto:', error);
    res.status(500).json({ success: false, erro: 'Erro ao adicionar canto' });
  }
});

// DELETE /api/setlists/:id/cantos/:cantoId - Remover canto da setlist
router.delete('/:id/cantos/:cantoId', verificarAuth, async (req, res) => {
  try {
    const { id, cantoId } = req.params;

    const setlistCanto = await prisma.setlistCanto.deleteMany({
      where: {
        setlistId: id,
        cantoId,
      },
    });

    if (setlistCanto.count === 0) {
      return res.status(404).json({
        success: false,
        erro: 'Canto não encontrado na setlist',
      });
    }

    // Recalcular duração total
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: { cantos: { include: { canto: true } } },
    });

    const novasDuracao = setlist!.cantos.reduce(
      (sum, sc) => sum + (sc.canto.duracao || 0),
      0
    );

    await prisma.setlist.update({
      where: { id },
      data: { duracao: novasDuracao },
    });

    res.json({
      success: true,
      mensagem: 'Canto removido da setlist',
      duracaoTotal: novasDuracao,
    });
  } catch (error) {
    console.error('Erro ao remover canto:', error);
    res.status(500).json({ success: false, erro: 'Erro ao remover canto' });
  }
});

// PUT /api/setlists/:id/cantos/:cantoId - Reordenar / atualizar canto na setlist
router.put('/:id/cantos/:cantoId', verificarAuth, async (req, res) => {
  try {
    const { id, cantoId } = req.params;
    const { ordem, tom, notas } = req.body;

    const updateData: any = {};
    if (ordem !== undefined) updateData.ordem = ordem;
    if (tom) updateData.tom = tom;
    if (notas !== undefined) updateData.notas = notas;

    const setlistCanto = await prisma.setlistCanto.updateMany({
      where: {
        setlistId: id,
        cantoId,
      },
      data: updateData,
    });

    if (setlistCanto.count === 0) {
      return res.status(404).json({
        success: false,
        erro: 'Canto não encontrado na setlist',
      });
    }

    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        cantos: {
          include: { canto: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      mensagem: 'Canto atualizado na setlist',
      dados: setlist,
    });
  } catch (error) {
    console.error('Erro ao atualizar canto:', error);
    res.status(500).json({ success: false, erro: 'Erro ao atualizar canto' });
  }
});

// GET /api/setlists - Listar setlists do usuário (com paginação)
router.get('/', verificarAuth, async (req: any, res: any) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [setlists, total] = await Promise.all([
      prisma.setlist.findMany({
        where: {
          usuarioId: req.usuarioId,
        },
        include: {
          cantos: { select: { canto: true } },
          usuario: { select: { nome: true } },
        },
        skip,
        take: limitNum,
        orderBy: { data: 'desc' },
      }),
      prisma.setlist.count({
        where: {
          usuarioId: req.usuarioId,
        },
      }),
    ]);

    res.json({
      success: true,
      count: setlists.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      dados: setlists,
    });
  } catch (error) {
    console.error('Erro ao listar setlists:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar setlists' });
  }
});

export default router;
