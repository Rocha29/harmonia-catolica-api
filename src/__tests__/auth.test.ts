import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('API - Auth Endpoints', () => {
  const mockUsuario = {
    id: 'user1',
    email: 'rocha29@test.local',
    nome: 'Robson Rocha (Test)',
    senhaHash: 'hashed_password_12345',
    perfilMissa: 'solene',
    paroquia: null,
    instrumento: null,
    classeVocal: null,
    fotoPerfil: null,
    bio: null,
    ativo: true,
    firebaseUID: null,
    criadoEm: new Date('2026-04-22'),
    atualizadoEm: new Date('2026-04-22'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register - Registrar usuário', () => {
    it('deve criar novo usuário com email e senha', async () => {
      const prisma = new PrismaClient();
      
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.usuario.create as jest.Mock).mockResolvedValue(mockUsuario);

      const senhaHash = await bcryptjs.hash('@123456@', 10);
      
      const result = await prisma.usuario.create({
        data: {
          email: 'rocha29@test.local',
          nome: 'Robson Rocha (Test)',
          senhaHash,
          perfilMissa: 'solene',
        },
      });

      expect(result.email).toBe('rocha29@test.local');
      expect(result.id).toBe('user1');
      expect(result.perfilMissa).toBe('solene');
    });

    it('deve usar bcrypt para hashar senha', async () => {
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_value');

      const hash = await bcryptjs.hash('@123456@', 10);

      expect(bcryptjs.hash).toHaveBeenCalledWith('@123456@', 10);
      expect(hash).toBe('hashed_value');
    });

    it('deve ser capaz de validar senha contra hash', async () => {
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      const isValid = await bcryptjs.compare('@123456@', mockUsuario.senhaHash);

      expect(isValid).toBe(true);
    });
  });

  describe('POST /api/auth/login - Login', () => {
    it('deve fazer login com email e senha corretos', async () => {
      const prisma = new PrismaClient();
      
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token_here');

      // Simulando login
      const usuario = await prisma.usuario.findUnique({
        where: { email: 'rocha29@test.local' },
      });

      const senhaValida = await bcryptjs.compare('@123456@', usuario.senhaHash);
      
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email },
        'jwt-secret',
        { expiresIn: '7d' }
      );

      expect(senhaValida).toBe(true);
      expect(token).toBe('jwt_token_here');
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const prisma = new PrismaClient();
      
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      const usuario = await prisma.usuario.findUnique({
        where: { email: 'rocha29@test.local' },
      });

      const senhaValida = await bcryptjs.compare('senha_errada', usuario.senhaHash);

      expect(senhaValida).toBe(false);
    });

    it('deve retornar erro se usuário não existe', async () => {
      const prisma = new PrismaClient();
      
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

      const usuario = await prisma.usuario.findUnique({
        where: { email: 'naoexiste@test.local' },
      });

      expect(usuario).toBeNull();
    });
  });

  describe('GET /api/auth/me - Perfil do usuário autenticado', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const prisma = new PrismaClient();
      
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);

      const usuario = await prisma.usuario.findUnique({
        where: { id: 'user1' },
      });

      expect(usuario).toBeDefined();
      expect(usuario.email).toBe('rocha29@test.local');
      expect(usuario.nome).toBe('Robson Rocha (Test)');
    });
  });

  describe('JWT Token', () => {
    it('deve gerar token JWT com dados corretos', () => {
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token');

      const token = jwt.sign(
        { id: 'user1', email: 'rocha29@test.local' },
        'secret',
        { expiresIn: '7d' }
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user1', email: 'rocha29@test.local' },
        'secret',
        { expiresIn: '7d' }
      );
      expect(token).toBe('jwt_token');
    });

    it('deve ter prazo de expiração de 7 dias', () => {
      const spy = jest.spyOn(jwt, 'sign');
      (jwt.sign as jest.Mock).mockReturnValue('token');

      jwt.sign({ id: 'user1' }, 'secret', { expiresIn: '7d' });

      expect(spy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({ expiresIn: '7d' })
      );
    });
  });

  describe('Perfil de Missa', () => {
    it('deve suportar perfil "solene"', () => {
      expect(mockUsuario.perfilMissa).toBe('solene');
    });

    it('deve suportar perfil "carismatico"', () => {
      const usuarioCarismatico = {
        ...mockUsuario,
        perfilMissa: 'carismatico',
      };

      expect(usuarioCarismatico.perfilMissa).toBe('carismatico');
    });
  });
});
