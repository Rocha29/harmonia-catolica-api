import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Usuario de teste
  const senhaHash = await bcrypt.hash('@123456@', 10);
  
  const usuario = await prisma.usuario.upsert({
    where: { email: 'rocha29@test.local' },
    update: {},
    create: {
      email: 'rocha29@test.local',
      nome: 'Robson Rocha (Test)',
      senhaHash,
      perfilMissa: 'solene',
      paroquia: 'Catedral Metropolitana',
      instrumento: 'Tenor',
      classeVocal: 'tenor',
      ativo: true,
    },
  });

  console.log('✅ Usuario criado/atualizado:', usuario);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
