import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-change-in-prod';

export const verificarAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, erro: 'Token não fornecido' });
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ success: false, erro: 'Token inválido' });
  }
};
