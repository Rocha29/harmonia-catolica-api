import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-change-in-prod';

interface LoginBody {
  email: string;
  senha: string;
}

interface RegisterBody {
  email: string;
  nome: string;
  senha: string;
  perfilMissa: string;
}

// POST /auth/login
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, senha } = req.body as LoginBody;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha obrigatórios' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.senhaHash) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        perfilMissa: usuario.perfilMissa,
      },
    });
  } catch (erro) {
    console.error('Erro login:', erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// POST /auth/register
router.post('/register', async (req: any, res: any) => {
  try {
    const { email, nome, senha, perfilMissa } = req.body as RegisterBody;

    if (!email || !nome || !senha || !perfilMissa) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExiste) {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        nome,
        senhaHash,
        perfilMissa,
        ativo: true,
        emailVerificado: false,
      },
    });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        perfilMissa: usuario.perfilMissa,
      },
    });
  } catch (erro) {
    console.error('Erro register:', erro);
    res.status(500).json({ erro: 'Erro ao registrar' });
  }
});

// GET /auth/me (verifica token)
router.get('/me', async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
    });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        perfilMissa: usuario.perfilMissa,
      },
    });
  } catch (erro) {
    console.error('Erro /me:', erro);
    res.status(401).json({ erro: 'Token inválido' });
  }
});

export default router;
