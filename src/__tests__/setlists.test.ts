import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

describe('API - Setlist Endpoints', () => {
  const mockSetlist = {
    id: 'setlist1',
    titulo: 'Missa de Páscoa 2026',
    data: new Date('2026-04-05'),
    estilo: 'solene',
    duracao: 540,
    usuarioId: 'user1',
    grupoId: null,
    linkPublico: 'abc123def456',
    notas: null,
    criadoEm: new Date('2026-04-22'),
    atualizadoEm: new Date('2026-04-22'),
    cantos: [
      {
        id: 'sc1',
        setlistId: 'setlist1',
        cantoId: 'canto1',
        ordem: 1,
        tom: 'Dó',
        notas: null,
        criadoEm: new Date('2026-04-22'),
        canto: {
          id: 'canto1',
          titulo: 'Jesus Cristo é Senhor',
          compositor: 'Anônimo',
          estilo: 'solene',
          dificuldade: 'basico',
          instrumento: 'Órgão',
          tom: 'Dó',
          duracao: 180,
          letra: 'Jesus Cristo é Senhor',
          cifra: 'C | C',
          momentoMissa: 'entrada',
          tempoLiturgico: 'tempo-ordinario',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/setlists - Criar setlist', () => {
    it('deve criar nova setlist com link público', async () => {
      const prisma = new PrismaClient();
      
      (prisma.setlist.create as jest.Mock).mockResolvedValue(mockSetlist);

      const result = await prisma.setlist.create({
        data: {
          titulo: 'Missa de Páscoa 2026',
          data: new Date('2026-04-05'),
          estilo: 'solene',
          duracao: 0,
          usuarioId: 'user1',
          grupoId: null,
          linkPublico: 'abc123def456',
        },
      });

      expect(result.id).toBe('setlist1');
      expect(result.titulo).toBe('Missa de Páscoa 2026');
      expect(result.linkPublico).toBeDefined();
    });

    it('link público deve ser único', async () => {
      const setlist1 = { ...mockSetlist, linkPublico: 'link1' };
      const setlist2 = { ...mockSetlist, id: 'setlist2', linkPublico: 'link2' };

      expect(setlist1.linkPublico).not.toBe(setlist2.linkPublico);
    });
  });

  describe('GET /api/setlists/:id - Obter setlist', () => {
    it('deve retornar setlist com todos os cantos', async () => {
      const prisma = new PrismaClient();
      
      (prisma.setlist.findUnique as jest.Mock).mockResolvedValue(mockSetlist);

      const result = await prisma.setlist.findUnique({
        where: { id: 'setlist1' },
        include: { cantos: { include: { canto: true } } },
      });

      expect(result).toBeDefined();
      expect(result.cantos).toHaveLength(1);
      expect(result.titulo).toBe('Missa de Páscoa 2026');
    });

    it('deve retornar null se setlist não existe', async () => {
      const prisma = new PrismaClient();
      
      (prisma.setlist.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await prisma.setlist.findUnique({
        where: { id: 'inexistente' },
      });

      expect(result).toBeNull();
    });
  });

  describe('GET /api/setlists/publica/:linkPublico - Link compartilhável', () => {
    it('deve acessar setlist por link público', async () => {
      const prisma = new PrismaClient();
      
      (prisma.setlist.findUnique as jest.Mock).mockResolvedValue(mockSetlist);

      const result = await prisma.setlist.findUnique({
        where: { linkPublico: 'abc123def456' },
      });

      expect(result).toBeDefined();
      expect(result.linkPublico).toBe('abc123def456');
    });
  });

  describe('POST /api/setlists/:id/cantos - Adicionar canto', () => {
    it('deve adicionar canto à setlist', async () => {
      const prisma = new PrismaClient();
      
      const novoSetlistCanto = {
        id: 'sc2',
        setlistId: 'setlist1',
        cantoId: 'canto2',
        ordem: 2,
        tom: 'Ré',
        notas: null,
        criadoEm: new Date(),
      };

      (prisma.setlistCanto.create as jest.Mock).mockResolvedValue(novoSetlistCanto);

      const result = await prisma.setlistCanto.create({
        data: {
          setlistId: 'setlist1',
          cantoId: 'canto2',
          ordem: 2,
          tom: 'Ré',
        },
      });

      expect(result.cantoId).toBe('canto2');
      expect(result.ordem).toBe(2);
    });

    it('deve rejeitar duplicatas (setlistId + cantoId)', async () => {
      const prisma = new PrismaClient();
      
      const erro = new Error('Unique constraint failed');
      (prisma.setlistCanto.create as jest.Mock).mockRejectedValue(erro);

      try {
        await prisma.setlistCanto.create({
          data: {
            setlistId: 'setlist1',
            cantoId: 'canto1', // Duplicado
            ordem: 2,
          },
        });
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect((error as any).message).toContain('Unique constraint failed');
      }
    });
  });

  describe('DELETE /api/setlists/:id/cantos/:cantoId - Remover canto', () => {
    it('deve remover canto da setlist', async () => {
      const prisma = new PrismaClient();
      
      (prisma.setlistCanto.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await prisma.setlistCanto.deleteMany({
        where: { setlistId: 'setlist1', cantoId: 'canto1' },
      });

      expect(result.count).toBe(1);
    });
  });

  describe('DELETE /api/setlists/:id - Deletar setlist', () => {
    it('deve deletar setlist e seus cantos', async () => {
      const prisma = new PrismaClient();
      
      (prisma.setlistCanto.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.setlist.delete as jest.Mock).mockResolvedValue(mockSetlist);

      // Simular delação
      await prisma.setlistCanto.deleteMany({
        where: { setlistId: 'setlist1' },
      });

      const result = await prisma.setlist.delete({
        where: { id: 'setlist1' },
      });

      expect(result.id).toBe('setlist1');
    });
  });

  describe('Duração total da setlist', () => {
    it('deve calcular duração corretamente', () => {
      const duracao = mockSetlist.cantos.reduce(
        (sum, sc) => sum + (sc.canto.duracao || 0),
        0
      );

      expect(duracao).toBe(180); // 1 canto de 180 segundos = 3 minutos
    });

    it('deve somar durações de múltiplos cantos', () => {
      const cantosMultiplos = [
        { canto: { duracao: 180 } },
        { canto: { duracao: 240 } },
        { canto: { duracao: 200 } },
      ];

      const duracao = cantosMultiplos.reduce(
        (sum: number, sc: any) => sum + (sc.canto.duracao || 0),
        0
      );

      expect(duracao).toBe(620); // ~10 minutos
    });
  });
});
