import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CANTOS: Array<{
  titulo: string;
  compositor: string;
  estilo: 'solene' | 'carismatico';
  dificuldade: 'basico' | 'intermediario' | 'avancado';
  instrumento: string;
  tom: string;
  duracao: number;
  letra: string;
  cifra: string;
  momentoMissa: string;
  tempoLiturgico: string;
}> = [
  // ENTRADA
  {
    titulo: 'Jesus Cristo é Senhor',
    compositor: 'Anônimo',
    estilo: 'solene',
    dificuldade: 'basico',
    instrumento: 'Órgão',
    tom: 'Dó',
    duracao: 180,
    letra: 'Jesus Cristo é Senhor / Aleluia, Aleluia',
    cifra: 'C | C | Am | G',
    momentoMissa: 'entrada',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Povo de Deus, Caminha',
    compositor: 'Pe. José Weber',
    estilo: 'carismatico',
    dificuldade: 'basico',
    instrumento: 'Violão',
    tom: 'Sol',
    duracao: 240,
    letra: 'Povo de Deus, caminha / Na estrada do Senhor',
    cifra: 'G | D | G | A',
    momentoMissa: 'entrada',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Glória, Glória',
    compositor: 'Tradicional',
    estilo: 'solene',
    dificuldade: 'basico',
    instrumento: 'Órgão',
    tom: 'Mi',
    duracao: 150,
    letra: 'Glória, glória, glória ao Senhor',
    cifra: 'E | B | C#m | A',
    momentoMissa: 'gloria',
    tempoLiturgico: 'tempo-ordinario',
  },

  // OFERTÓRIO
  {
    titulo: 'Vinde a Mim',
    compositor: 'Luciano Araújo',
    estilo: 'carismatico',
    dificuldade: 'intermediario',
    instrumento: 'Violão',
    tom: 'Lá',
    duracao: 240,
    letra: 'Vinde a mim / todos vós que estais cansados',
    cifra: 'Am | F | C | G',
    momentoMissa: 'ofertorio',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Santíssimo Sacramento',
    compositor: 'Tradicional',
    estilo: 'solene',
    dificuldade: 'avancado',
    instrumento: 'Órgão',
    tom: 'Fá',
    duracao: 300,
    letra: 'Santíssimo Sacramento / Puro mistério de amor',
    cifra: 'F | C | F | Bb',
    momentoMissa: 'ofertorio',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Pão da Vida',
    compositor: 'Irmã Glória',
    estilo: 'carismatico',
    dificuldade: 'basico',
    instrumento: 'Violão',
    tom: 'Ré',
    duracao: 200,
    letra: 'Pão da vida / Água da vida / Vós sois Jesus',
    cifra: 'D | A | D | G',
    momentoMissa: 'ofertorio',
    tempoLiturgico: 'tempo-ordinario',
  },

  // COMUNHÃO
  {
    titulo: 'Cordeiro de Deus',
    compositor: 'PE. Zezinho',
    estilo: 'carismatico',
    dificuldade: 'basico',
    instrumento: 'Violão',
    tom: 'Sol',
    duracao: 180,
    letra: 'Cordeiro de Deus / Que tira os pecados do mundo',
    cifra: 'G | D | Am | D',
    momentoMissa: 'comunhao',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Senhor Jesus, Vós sois',
    compositor: 'Tradicional',
    estilo: 'solene',
    dificuldade: 'intermediario',
    instrumento: 'Órgão',
    tom: 'Si',
    duracao: 240,
    letra: 'Senhor Jesus, vós sois pão vivo',
    cifra: 'B | F# | B | E',
    momentoMissa: 'comunhao',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Vou me Deixar Fascinar',
    compositor: 'Zezinho',
    estilo: 'carismatico',
    dificuldade: 'intermediario',
    instrumento: 'Violão',
    tom: 'Lá',
    duracao: 220,
    letra: 'Vou me deixar fascinar / Pela vida que vem de Ti',
    cifra: 'Am | F | G | E',
    momentoMissa: 'comunhao',
    tempoLiturgico: 'tempo-ordinario',
  },

  // FINAL
  {
    titulo: 'Ide em Paz',
    compositor: 'Tradicional',
    estilo: 'solene',
    dificuldade: 'basico',
    instrumento: 'Órgão',
    tom: 'Dó',
    duracao: 150,
    letra: 'Ide em paz / Que o Senhor vos acompanha',
    cifra: 'C | G | C | Am',
    momentoMissa: 'final',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Vós Sois a Glória',
    compositor: 'Zezinho',
    estilo: 'carismatico',
    dificuldade: 'intermediario',
    instrumento: 'Violão',
    tom: 'Sol Major',
    duracao: 240,
    letra: 'Vós sois a glória / Vós sois o amor',
    cifra: 'G | D | G | D',
    momentoMissa: 'final',
    tempoLiturgico: 'tempo-ordinario',
  },

  // FESTA DE PÁSCOA
  {
    titulo: 'Aleluia, Aleluia',
    compositor: 'Tradicional',
    estilo: 'carismatico',
    dificuldade: 'basico',
    instrumento: 'Violão',
    tom: 'Mi',
    duracao: 180,
    letra: 'Aleluia, aleluia / Cristo ressuscitou',
    cifra: 'E | B | E | B',
    momentoMissa: 'entrada',
    tempoLiturgico: 'pascoa',
  },
  {
    titulo: 'Cristo Venceu',
    compositor: 'Pe. José Marques',
    estilo: 'carismatico',
    dificuldade: 'intermediario',
    instrumento: 'Violão',
    tom: 'Ré',
    duracao: 240,
    letra: 'Cristo venceu / Aleluia / O Senhor ressuscitou',
    cifra: 'D | A | D | A',
    momentoMissa: 'entrada',
    tempoLiturgico: 'pascoa',
  },

  // QUARESMA
  {
    titulo: 'Meu Deus, Meu Deus',
    compositor: 'Tradicional',
    estilo: 'solene',
    dificuldade: 'intermediario',
    instrumento: 'Órgão',
    tom: 'Ré Menor',
    duracao: 300,
    letra: 'Meu Deus, meu Deus / Por que me desamparaste',
    cifra: 'Dm | Bb | F | C',
    momentoMissa: 'entrada',
    tempoLiturgico: 'quaresma',
  },
  {
    titulo: 'Senhor, Tende Piedade',
    compositor: 'Gregório',
    estilo: 'solene',
    dificuldade: 'avancado',
    instrumento: 'Órgão',
    tom: 'Fá',
    duracao: 240,
    letra: 'Senhor, tende piedade de nós',
    cifra: 'F | C | Bb | F',
    momentoMissa: 'gloria',
    tempoLiturgico: 'quaresma',
  },

  // NATAL
  {
    titulo: 'Noite Feliz',
    compositor: 'Franz Gruber',
    estilo: 'solene',
    dificuldade: 'basico',
    instrumento: 'Órgão',
    tom: 'Dó',
    duracao: 180,
    letra: 'Noite feliz / Noite feliz / Tudo dorme ao redor',
    cifra: 'C | G | C | F',
    momentoMissa: 'entrada',
    tempoLiturgico: 'natal',
  },
  {
    titulo: 'Jesus Nasce em Belém',
    compositor: 'Tradicional',
    estilo: 'carismatico',
    dificuldade: 'basico',
    instrumento: 'Violão',
    tom: 'Sol',
    duracao: 200,
    letra: 'Jesus nasce em Belém / Aleluia, doce segurança',
    cifra: 'G | D | G | A',
    momentoMissa: 'entrada',
    tempoLiturgico: 'natal',
  },

  // MAIS CANTOS DIVERSOS
  {
    titulo: 'Ó Mãe Querida',
    compositor: 'Zezinho',
    estilo: 'carismatico',
    dificuldade: 'intermediario',
    instrumento: 'Violão',
    tom: 'Lá',
    duracao: 220,
    letra: 'Ó Mãe querida / Intercedei por nós',
    cifra: 'Am | F | C | G',
    momentoMissa: 'comunhao',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Bendito Seja Deus',
    compositor: 'Traditional',
    estilo: 'solene',
    dificuldade: 'basico',
    instrumento: 'Órgão',
    tom: 'Si Maior',
    duracao: 160,
    letra: 'Bendito seja Deus / Pai, Filho e Espírito Santo',
    cifra: 'B | F# | B | E',
    momentoMissa: 'gloria',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Amor Infinito',
    compositor: 'Irmã Glória',
    estilo: 'carismatico',
    dificuldade: 'intermediario',
    instrumento: 'Violão',
    tom: 'Ré',
    duracao: 240,
    letra: 'Amor infinito / Perdão sem medida / Graça que não cessa',
    cifra: 'D | A | Bm | A',
    momentoMissa: 'ofertorio',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'O Cálice de Salvação',
    compositor: 'Tradicional',
    estilo: 'solene',
    dificuldade: 'avancado',
    instrumento: 'Órgão',
    tom: 'Mi Menor',
    duracao: 280,
    letra: 'O cálice de salvação / Vou tomar e o nome do Senhor invocarei',
    cifra: 'Em | Am | B | Em',
    momentoMissa: 'comunhao',
    tempoLiturgico: 'tempo-ordinario',
  },
  {
    titulo: 'Hosana ao Filho de Davi',
    compositor: 'Tradicional',
    estilo: 'solene',
    dificuldade: 'intermediario',
    instrumento: 'Órgão',
    tom: 'Ré',
    duracao: 200,
    letra: 'Hosana ao Filho de Davi / Bendito o que vem em nome do Senhor',
    cifra: 'D | A | D | G',
    momentoMissa: 'entrada',
    tempoLiturgico: 'ramos',
  },
  {
    titulo: 'Quanto Graça',
    compositor: 'Zezinho',
    estilo: 'carismatico',
    dificuldade: 'basico',
    instrumento: 'Violão',
    tom: 'Sol',
    duracao: 180,
    letra: 'Quanto graça / Deus vem trazer / Para esta noite de oração',
    cifra: 'G | D | G | A',
    momentoMissa: 'ofertorio',
    tempoLiturgico: 'tiempo-ordinario',
  },
];

async function seedCantos() {
  console.log('🎵 Seeding biblioteca de cantos...');

  // Limpar cantos existentes
  await prisma.canto.deleteMany();

  // Criar novos cantos
  let count = 0;
  for (const canto of CANTOS) {
    await prisma.canto.create({
      data: {
        titulo: canto.titulo,
        compositor: canto.compositor,
        estilo: canto.estilo,
        dificuldade: canto.dificuldade,
        instrumento: canto.instrumento,
        tom: canto.tom,
        duracao: canto.duracao,
        letra: canto.letra,
        cifra: canto.cifra,
        momentoMissa: canto.momentoMissa,
        tempoLiturgico: canto.tempoLiturgico,
        linkAudio: null,
        linkVideo: null,
      },
    });
    count++;
  }

  console.log(`✅ ${count} cantos criados na biblioteca`);
}

seedCantos()
  .catch(e => {
    console.error('❌ Erro ao seedar cantos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
