import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para verificar se é domingo
function ehDomingo(date: Date): boolean {
  return date.getDay() === 0;
}

// Função para gerar domingos de um intervalo
function gerarDomingosPeriodo(inicio: Date, fim: Date): Date[] {
  const domingos: Date[] = [];
  const data = new Date(inicio);
  
  // Ajusta para o primeiro domingo do período
  while (data <= fim) {
    if (ehDomingo(data)) {
      domingos.push(new Date(data));
    }
    data.setDate(data.getDate() + 1);
  }
  
  return domingos;
}

async function seedCalendario() {
  console.log('🗓️ Seeding calendário litúrgico 2026...');
  
  // Ano litúrgico 2026 começa com 1º Domingo do Advento (Nov 29, 2025)
  // Mas vamos focar no ano civil 2026
  
  const ano = 2026;
  const ciclos = ['A', 'B', 'C']; // Ciclo de 3 anos
  let cicloAtual = 1; // 2026 é Ano B (índice 1)
  
  // Principais datas litúrgicas de 2026
  const datasLiturgicas: Record<string, {
    data: string;
    nome: string;
    temporalidade: string;
    ciclo?: string;
    leituraPrincipal?: string;
  }> = {
    // NATAL
    '2026-12-25': {
      data: '2026-12-25',
      nome: 'Natal do Senhor',
      temporalidade: 'natal',
      ciclo: 'A',
      leituraPrincipal: 'Isaías 9,2-7 | Salmo 96 | Tito 2,11-14 | Lucas 2,1-14'
    },
    '2026-12-27': { // 1º Domingo após Natal
      data: '2026-12-27',
      nome: '1º Domingo após Natal',
      temporalidade: 'natal',
      ciclo: 'B'
    },
    
    // EPIFANIA
    '2026-01-06': {
      data: '2026-01-06',
      nome: 'Epifania do Senhor',
      temporalidade: 'epifania',
      ciclo: 'A',
      leituraPrincipal: 'Isaías 60,1-6 | Salmo 72 | Efésios 3,2-3a.5-6 | Mateus 2,1-12'
    },
    
    // QUARESMA - Começa 4ª-feira de Cinzas (eleita para Ash Wednesday)
    '2026-02-18': {
      data: '2026-02-18',
      nome: '4ª-feira de Cinzas',
      temporalidade: 'quaresma',
      ciclo: 'B'
    },
    '2026-02-22': {
      data: '2026-02-22',
      nome: '1º Domingo da Quaresma',
      temporalidade: 'quaresma',
      ciclo: 'B'
    },
    
    // PÁSCOA - 5 de abril 2026
    '2026-04-05': {
      data: '2026-04-05',
      nome: 'Domingo de Páscoa',
      temporalidade: 'pascoa',
      ciclo: 'B',
      leituraPrincipal: 'Atos 10,34a.37-43 | Salmo 118 | 1 Coríntios 5,6b-8 | João 20,1-9'
    },
    
    // PENTECOSTES
    '2026-05-24': {
      data: '2026-05-24',
      nome: 'Pentecostes',
      temporalidade: 'pascoa',
      ciclo: 'B',
      leituraPrincipal: 'Atos 2,1-11 | Salmo 104 | 1 Coríntios 12,3b-7.12-13 | João 20,19-23'
    },
    
    // CORPUS CHRISTI
    '2026-05-28': {
      data: '2026-05-28',
      nome: 'Corpus Christi',
      temporalidade: 'tempo-ordinario',
      ciclo: 'B'
    },
    
    // SAGRADO CORAÇÃO
    '2026-06-05': {
      data: '2026-06-05',
      nome: 'Sagrado Coração de Jesus',
      temporalidade: 'tempo-ordinario',
      ciclo: 'B'
    },
    
    // JOÃO BATISTA
    '2026-06-24': {
      data: '2026-06-24',
      nome: 'Natividade de São João Batista',
      temporalidade: 'santos',
      ciclo: 'B'
    },
    
    // SANTOS PEDRO E PAULO
    '2026-06-29': {
      data: '2026-06-29',
      nome: 'Santos Pedro e Paulo, Apóstolos',
      temporalidade: 'santos',
      ciclo: 'B'
    },
    
    // ASSUNÇÃO DE MARIA
    '2026-08-15': {
      data: '2026-08-15',
      nome: 'Assunção de Maria',
      temporalidade: 'santos',
      ciclo: 'B'
    },
    
    // NATIVIDADE DE MARIA
    '2026-09-08': {
      data: '2026-09-08',
      nome: 'Natividade de Maria',
      temporalidade: 'santos',
      ciclo: 'B'
    },
    
    // EXALTAÇÃO DA SANTA CRUZ
    '2026-09-14': {
      data: '2026-09-14',
      nome: 'Exaltação da Santa Cruz',
      temporalidade: 'santos',
      ciclo: 'B'
    },
    
    // FINADOS
    '2026-11-01': {
      data: '2026-11-01',
      nome: 'Festa de Todos os Santos',
      temporalidade: 'santos',
      ciclo: 'B'
    },
    
    '2026-11-02': {
      data: '2026-11-02',
      nome: 'Finados',
      temporalidade: 'santos',
      ciclo: 'B'
    },
    
    // CRISTO REI
    '2026-11-22': {
      data: '2026-11-22',
      nome: 'Cristo Rei do Universo',
      temporalidade: 'tempo-ordinario',
      ciclo: 'B'
    },
  };
  
  const diasLiturgicos = [];
  
  // Adicionar dados manuais
  for (const [, info] of Object.entries(datasLiturgicas)) {
    diasLiturgicos.push({
      data: new Date(info.data),
      tempo: info.temporalidade,
      ciclo: info.ciclo || '',
      domingo: 0,
      festa: info.nome,
      graue: null,
      leitura1: null,
      salmo: null,
      leitura2: null,
      evangelho: null,
      aleluia: null,
      notas: info.leituraPrincipal || null,
    });
  }
  
  // Adicionar todos os domingos de 2026 com ciclos apropriados
  const inicio = new Date('2026-01-04'); // Primeiro domingo de 2026
  const fim = new Date('2026-12-31');
  const domingos = gerarDomingosPeriodo(inicio, fim);
  
  for (let i = 0; i < domingos.length; i++) {
    const domingo = domingos[i];
    const cicloIndex = (i + cicloAtual) % 3;
    const ciclo = ciclos[cicloIndex];
    
    // Verificar se já existe dia especial
    const jaExiste = diasLiturgicos.some(
      d => d.data.toISOString().split('T')[0] === domingo.toISOString().split('T')[0]
    );
    
    if (!jaExiste) {
      const semanaDoAno = Math.ceil((i + 1) / 4);
      const nomeTemporada = getNomeTemporada(domingo);
      
      diasLiturgicos.push({
        data: new Date(domingo),
        tempo: 'tiempo-ordinario',
        ciclo: ciclo,
        domingo: semanaDoAno,
        festa: `${ordinais(semanaDoAno)}º Domingo do ${nomeTemporada}`,
        graue: null,
        leitura1: null,
        salmo: null,
        leitura2: null,
        evangelho: null,
        aleluia: null,
        notas: null,
      });
    }
  }
  
  // Limpar dias litúrgicos existentes
  await prisma.diaLiturgico.deleteMany();
  
  // Criar novos registros
  for (const dia of diasLiturgicos) {
    await prisma.diaLiturgico.create({
      data: {
        data: dia.data,
        tempo: dia.tempo,
        ciclo: dia.ciclo,
        domingo: dia.domingo,
        festa: dia.festa,
        graue: dia.graue,
        leitura1: dia.leitura1,
        salmo: dia.salmo,
        leitura2: dia.leitura2,
        evangelho: dia.evangelho,
        aleluia: dia.aleluia,
        notas: dia.notas,
      },
    });
  }
  
  console.log(`✅ ${diasLiturgicos.length} dias litúrgicos criados para 2026`);
}

function getNomeTemporada(data: Date): string {
  const mes = data.getMonth();
  const dia = data.getDate();
  
  if ((mes === 10 && dia >= 29) || mes === 11) {
    return 'Advento';
  } else if (mes === 0 || (mes === 1 && dia <= 17)) {
    return 'Natal';
  } else if (mes === 1 || mes === 2 || (mes === 3 && dia <= 4)) {
    return 'Quaresma';
  } else if ((mes === 3 && dia >= 5) || mes === 4) {
    return 'Páscoa';
  } else {
    return 'Tempo Ordinário';
  }
}

function ordinais(n: number): string {
  if (n === 1) return '1º';
  if (n === 2) return '2º';
  if (n === 3) return '3º';
  return `${n}º`;
}

seedCalendario()
  .catch(e => {
    console.error('❌ Erro ao seedar calendário:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
