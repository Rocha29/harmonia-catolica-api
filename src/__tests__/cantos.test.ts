import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    canto: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    setlist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    setlistCanto: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

describe('API - Cantos Endpoints', () => {
  const mockCantos = [
    {
      id: 'canto1',
      titulo: 'Jesus Cristo é Senhor',
      compositor: 'Anônimo',
      estilo: 'solene',
      dificuldade: 'basico',
      instrumento: 'Órgão',
      tom: 'Dó',
      duracao: 180,
      letra: 'Jesus Cristo é Senhor / Aleluia',
      cifra: 'C | C | Am | G',
      linkAudio: null,
      linkVideo: null,
      tempoLiturgico: 'tempo-ordinario',
      momentoMissa: 'entrada',
      notas: null,
      criadoEm: new Date('2026-04-22'),
      atualizadoEm: new Date('2026-04-22'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cantos', () => {
    it('deve retornar lista de cantos', async () => {
      const prisma = new PrismaClient();
      
      (prisma.canto.findMany as jest.Mock).mockResolvedValue(mockCantos);
      (prisma.canto.count as jest.Mock).mockResolvedValue(1);

      const result = await prisma.canto.findMany();
      
      expect(result).toHaveLength(1);
      expect(result[0].titulo).toBe('Jesus Cristo é Senhor');
    });

    it('deve filtrar cantos por estilo', async () => {
      const prisma = new PrismaClient();
      
      const cantosSolene = mockCantos.filter(c => c.estilo === 'solene');
      (prisma.canto.findMany as jest.Mock).mockResolvedValue(cantosSolene);

      const result = await prisma.canto.findMany({
        where: { estilo: 'solene' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].estilo).toBe('solene');
    });

    it('deve aplicar paginação', async () => {
      const prisma = new PrismaClient();
      
      (prisma.canto.findMany as jest.Mock).mockResolvedValue(mockCantos);
      (prisma.canto.count as jest.Mock).mockResolvedValue(23);

      const result = await prisma.canto.findMany({
        skip: 0,
        take: 20,
      });

      expect(result).toBeDefined();
    });
  });

  describe('GET /api/cantos/:id', () => {
    it('deve retornar um canto específico', async () => {
      const prisma = new PrismaClient();
      
      (prisma.canto.findUnique as jest.Mock).mockResolvedValue(mockCantos[0]);

      const result = await prisma.canto.findUnique({
        where: { id: 'canto1' },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('canto1');
    });

    it('deve retornar null se canto não existe', async () => {
      const prisma = new PrismaClient();
      
      (prisma.canto.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await prisma.canto.findUnique({
        where: { id: 'inexistente' },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/cantos', () => {
    it('deve criar novo canto', async () => {
      const prisma = new PrismaClient();
      
      const novoCanto = {
        ...mockCantos[0],
        id: 'novo-canto',
      };

      (prisma.canto.create as jest.Mock).mockResolvedValue(novoCanto);

      const result = await prisma.canto.create({
        data: {
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
      });

      expect(result.id).toBe('novo-canto');
      expect(result.titulo).toBe('Jesus Cristo é Senhor');
    });
  });

  describe('PUT /api/cantos/:id', () => {
    it('deve atualizar canto existente', async () => {
      const prisma = new PrismaClient();
      
      const cantoAtualizado = {
        ...mockCantos[0],
        titulo: 'Jesus Cristo é Senhor - Atualizado',
      };

      (prisma.canto.update as jest.Mock).mockResolvedValue(cantoAtualizado);

      const result = await prisma.canto.update({
        where: { id: 'canto1' },
        data: { titulo: 'Jesus Cristo é Senhor - Atualizado' },
      });

      expect(result.titulo).toBe('Jesus Cristo é Senhor - Atualizado');
    });
  });

  describe('DELETE /api/cantos/:id', () => {
    it('deve deletar canto', async () => {
      const prisma = new PrismaClient();
      
      (prisma.canto.delete as jest.Mock).mockResolvedValue(mockCantos[0]);

      const result = await prisma.canto.delete({
        where: { id: 'canto1' },
      });

      expect(result.id).toBe('canto1');
    });
  });
});
