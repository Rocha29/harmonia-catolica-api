import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/calendario - Listar todos os dias litúrgicos com opções de filtro
router.get('/', async (req, res) => {
  try {
    const { mes, ano, ciclo, tempo } = req.query;

    let where: any = {};

    if (mes && ano) {
      const mesNum = parseInt(mes as string);
      const anoNum = parseInt(ano as string);
      
      const inicio = new Date(anoNum, mesNum - 1, 1);
      const fim = new Date(anoNum, mesNum, 0);

      where.data = {
        gte: inicio,
        lte: fim,
      };
    }

    if (ciclo) {
      where.ciclo = ciclo;
    }

    if (tempo) {
      where.tempo = tempo;
    }

    const dias = await prisma.diaLiturgico.findMany({
      where,
      orderBy: { data: 'asc' },
    });

    res.json({
      success: true,
      count: dias.length,
      dados: dias,
    });
  } catch (error) {
    console.error('Erro ao listar calendário:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar calendário' });
  }
});

// GET /api/calendario/:data - Obter dia litúrgico específico
// Formato: ?data=2026-04-05 (YYYY-MM-DD)
router.get('/dia/:data', async (req, res) => {
  try {
    const { data } = req.params;
    
    // Validar formato da data
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) {
      return res.status(400).json({ 
        success: false, 
        erro: 'Formato de data inválido. Use YYYY-MM-DD' 
      });
    }

    const dia = await prisma.diaLiturgico.findUnique({
      where: { data: dataObj },
    });

    if (!dia) {
      return res.status(404).json({ 
        success: false, 
        erro: 'Data litúrgica não encontrada' 
      });
    }

    res.json({
      success: true,
      dados: dia,
    });
  } catch (error) {
    console.error('Erro ao buscar dia litúrgico:', error);
    res.status(500).json({ success: false, erro: 'Erro ao buscar dia litúrgico' });
  }
});

// GET /api/calendario/proximos - Próximos 7 dias
router.get('/proximos/semana', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const proximaSemana = new Date(hoje);
    proximaSemana.setDate(proximaSemana.getDate() + 7);

    const dias = await prisma.diaLiturgico.findMany({
      where: {
        data: {
          gte: hoje,
          lte: proximaSemana,
        },
      },
      orderBy: { data: 'asc' },
    });

    res.json({
      success: true,
      count: dias.length,
      dados: dias,
    });
  } catch (error) {
    console.error('Erro ao listar próximos dias:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar próximos dias' });
  }
});

// GET /api/calendario/ciclos - Listar ciclos disponíveis
router.get('/ciclos/listar', async (req, res) => {
  try {
    const ciclos = await prisma.diaLiturgico.findMany({
      distinct: ['ciclo'],
      select: { ciclo: true },
      where: {
        ciclo: { not: '' },
      },
    });

    const ciclosUnicos = ciclos
      .map(c => c.ciclo)
      .filter(Boolean)
      .sort();

    res.json({
      success: true,
      ciclos: ciclosUnicos,
    });
  } catch (error) {
    console.error('Erro ao listar ciclos:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar ciclos' });
  }
});

// GET /api/calendario/tempos - Listar tempos litúrgicos disponíveis
router.get('/tempos/listar', async (req, res) => {
  try {
    const tempos = await prisma.diaLiturgico.findMany({
      distinct: ['tempo'],
      select: { tempo: true },
      where: {
        tempo: { not: '' },
      },
    });

    const temposUnicos = tempos
      .map(t => t.tempo)
      .filter(Boolean)
      .sort();

    res.json({
      success: true,
      tempos: temposUnicos,
    });
  } catch (error) {
    console.error('Erro ao listar tempos:', error);
    res.status(500).json({ success: false, erro: 'Erro ao listar tempos' });
  }
});

export default router;
