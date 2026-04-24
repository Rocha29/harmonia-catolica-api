import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarAuth } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/cantos - Listar cantos com filtros
router.get('/', async (req, res) => {
  try {
    const { 
      estilo, 
      dificuldade, 
      momentoMissa, 
      tempoLiturgico, 
      busca,
      page = '1',
      limit = '20'
    } = req.query;

    let where: any = {};

    if (estilo) {
      where.estilo = estilo;
    }

    if (dificuldade) {
      where.dificuldade = dificuldade;
    }

    if (momentoMissa) {
      where.momentoMissa = momentoMissa;
    }

    if (tempoLiturgico) {
      where.tempoLiturgico = {
        contains: tempoLiturgico,
      };
    }

    if (busca) {
      where.OR = [
        { titulo: { contains: busca as string } },
        { compositor: { contains: busca as string } },
        { letra: { contains: busca as string } },
      ];
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [cantos, total] = await Promise.all([
      prisma.canto.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { titulo: 'asc' },
      }),
      prisma.canto.count({ where }),
    ]);

    res.json({
      success: true,
      count: cantos.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      dados: cantos,
    });
  } catch (error) {
    console.error('Erro ao listar cantos:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar cantos' });
  }
});

// GET /api/cantos/saude - Estatísticas de saúde do repertório (V2)
router.get('/saude', async (_req, res) => {
  try {
    const [dominada, geladeira, nova, estudando, total] = await Promise.all([
      prisma.canto.count({ where: { status: 'dominada' } }),
      prisma.canto.count({ where: { status: 'geladeira' } }),
      prisma.canto.count({ where: { status: 'nova' } }),
      prisma.canto.count({ where: { status: 'estudando' } }),
      prisma.canto.count(),
    ]);
    res.json({ success: true, dados: { dominada, geladeira, nova, estudando, total } });
  } catch (error) {
    res.status(500).json({ success: false, erro: 'Erro ao buscar saúde do repertório' });
  }
});

// GET /api/cantos/deck - Deck de expansão: nova + geladeira + estudando (V2)
router.get('/deck', async (_req, res) => {
  try {
    const cantos = await prisma.canto.findMany({
      where: { status: { in: ['nova', 'geladeira', 'estudando'] } },
      orderBy: [{ status: 'asc' }, { ultimaVez: 'asc' }],
    });
    res.json({ success: true, count: cantos.length, dados: cantos });
  } catch (error) {
    res.status(500).json({ success: false, erro: 'Erro ao buscar deck' });
  }
});

// PATCH /api/cantos/:id/status - Atualizar status do canto (V2)
router.patch('/:id/status', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const permitidos = ['dominada', 'geladeira', 'nova', 'estudando'];
    if (!permitidos.includes(status)) {
      return res.status(400).json({ success: false, erro: 'Status inválido' });
    }
    const canto = await prisma.canto.update({
      where: { id },
      data: {
        status,
        ultimaVez: status === 'dominada' ? new Date() : undefined,
      },
    });
    res.json({ success: true, dados: canto });
  } catch (error) {
    res.status(500).json({ success: false, erro: 'Erro ao atualizar status' });
  }
});

// GET /api/cantos/:id - Obter um canto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const canto = await prisma.canto.findUnique({
      where: { id },
      include: {
        avaliacoes: {
          select: {
            rating: true,
            comentario: true,
            usuario: { select: { nome: true } },
          },
        },
      },
    });

    if (!canto) {
      return res.status(404).json({ 
        success: false, 
        erro: 'Canto não encontrado' 
      });
    }

    // Calcular rating médio
    const ratingMedio = canto.avaliacoes.length > 0
      ? (canto.avaliacoes.reduce((sum, a) => sum + a.rating, 0) / canto.avaliacoes.length).toFixed(1)
      : null;

    res.json({
      success: true,
      dados: {
        ...canto,
        ratingMedio,
        totalAvaliacoes: canto.avaliacoes.length,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar canto:', error);
    res.status(500).json({ success: false, erro: 'Erro ao buscar canto' });
  }
});

// POST /api/cantos - Criar novo canto (requer autenticação)
router.post('/', verificarAuth, async (req, res) => {
  try {
    const {
      titulo,
      compositor,
      estilo,
      dificuldade,
      instrumento,
      tom,
      duracao,
      letra,
      cifra,
      momentoMissa,
      tempoLiturgico,
    } = req.body;

    // Validações
    if (!titulo || !compositor || !estilo || !dificuldade || !instrumento) {
      return res.status(400).json({ 
        success: false, 
        erro: 'Campos obrigatórios: titulo, compositor, estilo, dificuldade, instrumento' 
      });
    }

    if (!['solene', 'carismatico'].includes(estilo)) {
      return res.status(400).json({ 
        success: false, 
        erro: 'Estilo deve ser "solene" ou "carismatico"' 
      });
    }

    if (!['basico', 'intermediario', 'avancado'].includes(dificuldade)) {
      return res.status(400).json({ 
        success: false, 
        erro: 'Dificuldade deve ser "basico", "intermediario" ou "avancado"' 
      });
    }

    const canto = await prisma.canto.create({
      data: {
        titulo,
        compositor,
        estilo,
        dificuldade,
        instrumento,
        tom,
        duracao: parseInt(duracao) || 0,
        letra,
        cifra,
        momentoMissa,
        tempoLiturgico,
      },
    });

    res.status(201).json({
      success: true,
      mensagem: 'Canto criado com sucesso',
      dados: canto,
    });
  } catch (error) {
    console.error('Erro ao criar canto:', error);
    res.status(500).json({ success: false, erro: 'Erro ao criar canto' });
  }
});

// PUT /api/cantos/:id - Atualizar canto (requer autenticação)
router.put('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validar que o canto existe
    const cantoExistente = await prisma.canto.findUnique({ where: { id } });
    if (!cantoExistente) {
      return res.status(404).json({ 
        success: false, 
        erro: 'Canto não encontrado' 
      });
    }

    // Validar estilo se fornecido
    if (updateData.estilo && !['solene', 'carismatico'].includes(updateData.estilo)) {
      return res.status(400).json({ 
        success: false, 
        erro: 'Estilo deve ser "solene" ou "carismatico"' 
      });
    }

    // Validar dificuldade se fornecida
    if (updateData.dificuldade && !['basico', 'intermediario', 'avancado'].includes(updateData.dificuldade)) {
      return res.status(400).json({ 
        success: false, 
        erro: 'Dificuldade deve ser "basico", "intermediario" ou "avancado"' 
      });
    }

    const canto = await prisma.canto.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      mensagem: 'Canto atualizado com sucesso',
      dados: canto,
    });
  } catch (error) {
    console.error('Erro ao atualizar canto:', error);
    res.status(500).json({ success: false, erro: 'Erro ao atualizar canto' });
  }
});

// DELETE /api/cantos/:id - Deletar canto (requer autenticação)
router.delete('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const cantoExistente = await prisma.canto.findUnique({ where: { id } });
    if (!cantoExistente) {
      return res.status(404).json({ 
        success: false, 
        erro: 'Canto não encontrado' 
      });
    }

    await prisma.canto.delete({
      where: { id },
    });

    res.json({
      success: true,
      mensagem: 'Canto deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar canto:', error);
    res.status(500).json({ success: false, erro: 'Erro ao deletar canto' });
  }
});

// GET /api/cantos/filtros/estilos - Obter estilos disponíveis
router.get('/filtros/estilos', async (req, res) => {
  try {
    const estilos = await prisma.canto.findMany({
      distinct: ['estilo'],
      select: { estilo: true },
    });

    res.json({
      success: true,
      estilos: estilos.map(e => e.estilo).sort(),
    });
  } catch (error) {
    console.error('Erro ao listar estilos:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar estilos' });
  }
});

// GET /api/cantos/filtros/dificuldades - Obter dificuldades disponíveis
router.get('/filtros/dificuldades', async (req, res) => {
  try {
    const dificuldades = await prisma.canto.findMany({
      distinct: ['dificuldade'],
      select: { dificuldade: true },
    });

    res.json({
      success: true,
      dificuldades: dificuldades.map(d => d.dificuldade).sort(),
    });
  } catch (error) {
    console.error('Erro ao listar dificuldades:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar dificuldades' });
  }
});

// GET /api/cantos/filtros/momentos - Obter momentos da missa disponíveis
router.get('/filtros/momentos', async (req, res) => {
  try {
    const momentos = await prisma.canto.findMany({
      distinct: ['momentoMissa'],
      select: { momentoMissa: true },
    });

    res.json({
      success: true,
      momentos: momentos.map(m => m.momentoMissa).sort(),
    });
  } catch (error) {
    console.error('Erro ao listar momentos:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar momentos' });
  }
});

// POST /api/cantos/importar-cifra — busca dados de uma música no Cifra Club pela URL
router.post('/importar-cifra', verificarAuth, async (req: any, res: any) => {
  const { url } = req.body;
  if (!url || !url.includes('cifraclub.com.br')) {
    return res.status(400).json({ success: false, erro: 'Informe uma URL válida do Cifra Club' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HarmoniaCatolica/1.0)',
        'Accept': 'text/html',
      },
    });
    if (!response.ok) throw new Error('Não foi possível acessar a página');
    const html = await response.text();

    // Extrair título (og:title ou h1.t1)
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? '';
    const h1Match = html.match(/<h1[^>]*class="[^"]*t1[^"]*"[^>]*>([^<]+)</)?.[1] ?? '';
    const titulo = h1Match || ogTitle.split(' - ')[0] || 'Título não encontrado';

    // Extrair compositor/artista
    const artistaMeta = html.match(/<meta[^>]*name="author"[^>]*content="([^"]+)"/)?.[1] ?? '';
    const artistaH2 = html.match(/<h2[^>]*class="[^"]*artist[^"]*"[^>]*><a[^>]*>([^<]+)<\/a>/)?.[1] ?? '';
    const compositor = artistaH2 || artistaMeta || ogTitle.split(' - ')[1] || '';

    // Extrair cifra (conteúdo do <pre> principal)
    const preMatches = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/gi) ?? [];
    const cifra = preMatches
      .map((p: string) => p.replace(/<[^>]+>/g, ''))
      .join('\n\n')
      .trim()
      .slice(0, 10000);

    // Tom (ex: "Tom: Am" ou "cifra em Am")
    const tomMatch = html.match(/[Tt]om[:\s]+([A-G][b#]?m?)/)?.[1] ?? '';

    res.json({
      success: true,
      dados: {
        titulo,
        compositor,
        cifra,
        tom: tomMatch,
        linkOrigem: url,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, erro: 'Erro ao buscar cifra: ' + err.message });
  }
});

export default router;
