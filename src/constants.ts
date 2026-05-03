import type { Unit } from './types';

export const COLORS: Record<string, { main: string; light: string; dark: string; accent: string }> = {
  gamer:    { main: '#E32636', light: '#F8F9FA', dark: '#2D3436', accent: '#00CFFF' },
  creative: { main: '#E52E2E', light: '#F8F9FA', dark: '#4361EE', accent: '#FF8C00' },
  pop:      { main: '#E52E2E', light: '#06D6A0', dark: '#7209B7', accent: '#FFD60A' },
  emerald:  { main: '#059669', light: '#ECFDF5', dark: '#064E3B', accent: '#10b981' },
  sapphire: { main: '#2563EB', light: '#EFF6FF', dark: '#1E3A8A', accent: '#60a5fa' },
  terracotta:{ main: '#D97706', light: '#FFFBEB', dark: '#451A03', accent: '#fbbf24' },
  amethyst: { main: '#7C3AED', light: '#F5F3FF', dark: '#2E1065', accent: '#a78bfa' },
  crimson:  { main: '#DC2626', light: '#FEF2F2', dark: '#450A0A', accent: '#f87171' },
  seafoam:  { main: '#059669', light: '#ECFDF5', dark: '#064E3B', accent: '#10b981' },
  royal:    { main: '#2563EB', light: '#EFF6FF', dark: '#1E3A8A', accent: '#60a5fa' },
  sunset:   { main: '#D97706', light: '#FFFBEB', dark: '#451A03', accent: '#fbbf24' },
  lavender: { main: '#7C3AED', light: '#F5F3FF', dark: '#2E1065', accent: '#a78bfa' },
  ruby:     { main: '#DC2626', light: '#FEF2F2', dark: '#450A0A', accent: '#f87171' },
  natural:  { main: '#468432', light: '#FFEF91', dark: '#2D521F', accent: '#FFA02E' },
};

export const DEFAULT_UNITS: Unit[] = [
  {id:'u1',color:'natural',sort_order:0,title:'Nossa cozinha',sub:'Aula 1',
   icon3D: '/unit-icons/aula-1.png', iconOutline: '/unit-icons/aula-1-off.png',
   brief:'Antes de começar: vá à cozinha com ela e segure objetos reais. Diga o nome em inglês devagar.',
   plan_c:'Vocabulário da cozinha; palavras-objeto',plan_h:'Identificar palavras em inglês por contexto',plan_e:'Objetos reais; leitura em voz alta',plan_a:'Apontamento correto',wa:'Aula 1 — Nossa cozinha',questions:[{q:'O que significa SPOON?',type:'mc',opts:['Colher','Garfo','Faca','Panela']}]},
  
  {id:'u7',color:'natural',sort_order:1,title:'Cores e Frutas',sub:'Aula 2',
   icon3D: '/unit-icons/Aula 7 Cores e Frutas.png', iconOutline: '/unit-icons/Aula 7 Cores e Frutas-não iniciada.png',
   brief:'Use frutas reais.',plan_c:'Cores e frutas',plan_h:'Associar cores a objetos',plan_e:'Frutas reais',plan_a:'Identificação correta',wa:'Aula 2 — Cores e Frutas',questions:[{q:'Como se diz VERMELHO em inglês?',type:'mc',opts:['Red','Blue','Green','Yellow']}]},
  
  {id:'u8',color:'natural',sort_order:2,title:'Números e Quantidade',sub:'Aula 3',
   icon3D: '/unit-icons/Aula 8 Números e Quantidade.png', iconOutline: '/unit-icons/Aula 8 Números e Quantidade-não iniciada.png',
   brief:'Conte objetos na mesa.',plan_c:'Numbers 1-10',plan_h:'Contar até 10',plan_e:'Contagem física',plan_a:'Contagem correta',wa:'Aula 3 — Números',questions:[{q:'Como se diz 3 em inglês?',type:'mc',opts:['Three','One','Five','Ten']}]},
  
  {id:'u6',color:'natural',sort_order:3,title:'Receita',sub:'Aula 4',
   icon3D: '/unit-icons/aula-6.png', iconOutline: '/unit-icons/aula-6-off.png',
   brief:'Ela é a professora hoje.',plan_c:'Receita; verbos de instrução',plan_h:'Produzir frase instrucional',plan_e:'Inversão de papel',plan_a:'1 frase completa',wa:'Aula 4 — Receita',questions:[{q:'Qual prato você quer me ensinar hoje?',type:'text'}]},
  
  {id:'u4',color:'natural',sort_order:4,title:'Inglês no Cotidiano',sub:'Aula 5',
   icon3D: '/unit-icons/aula-4.png', iconOutline: '/unit-icons/aula-4-off.png',
   brief:'Separe embalagens reais.',plan_c:'Inglês no cotidiano',plan_h:'Reconhecer palavras',plan_e:'Embalagens reais',plan_a:'Identificação de 1 palavra',wa:'Aula 5 — Inglês no dia a dia',questions:[{q:'O que significa RICE?',type:'mc',opts:['Arroz','Feijão','Frango','Sal']}]},
  
  {id:'u3',color:'natural',sort_order:5,title:'Apresentação Pessoal',sub:'Aula 6',
   icon3D: '/unit-icons/aula-3.png', iconOutline: '/unit-icons/aula-3-off.png',
   brief:'"My name is...".',plan_c:'Apresentação pessoal',plan_h:'Produzir frase simples',plan_e:'Mediador modela',plan_a:'Produção oral',wa:'Aula 6 — Apresentação',questions:[{q:'O que significa MY NAME IS?',type:'mc',opts:['Meu nome é','Eu gosto de','Eu tenho','Onde fica']}]},
  
  {id:'u10',color:'natural',sort_order:6,title:'Partes do Corpo',sub:'Aula 7',
   icon3D: '/unit-icons/Partes do Corpo.png', iconOutline: '/unit-icons/Partes do Corpo-não iniciada.png',
   brief:'Touch your head.',plan_c:'Partes do corpo',plan_h:'Identificar partes',plan_e:'Mímica',plan_a:'Identificação correta',wa:'Aula 7 — Corpo',questions:[{q:'Onde fica o seu NOSE?',type:'mc',opts:['Nariz','Olho','Boca','Orelha']}]},
  
  {id:'u9',color:'natural',sort_order:7,title:'Minha Família',sub:'Aula 8',
   icon3D: '/unit-icons/Minha Família.png', iconOutline: '/unit-icons/Minha Família-não iniciada.png',
   brief:'Use fotos da família.',plan_c:'Membros da família',plan_h:'Identificar membros',plan_e:'Fotos reais',plan_a:'Identificação correta',wa:'Aula 8 — Família',questions:[{q:'Como se diz MÃE em inglês?',type:'mc',opts:['Mother','Father','Sister','Brother']}]},
  
  {id:'u5',color:'natural',sort_order:8,title:'Gêneros Digitais',sub:'Aula 9',
   icon3D: '/unit-icons/aula-5.png', iconOutline: '/unit-icons/aula-5-off.png',
   brief:'Use o celular REAL.',plan_c:'Gêneros digitais',plan_h:'Identificar STORY, LIKE',plan_e:'Celular real',plan_a:'Identificação correta',wa:'Aula 9 — Inglês no celular',questions:[{q:'O que é uma STORY?',type:'mc',opts:['Foto/vídeo que some','Mensagem','Seguir','Comentário']}]},

  {id:'u11',color:'natural',sort_order:9,title:'Animais e Sons',sub:'Aula 10',
   icon3D: '/unit-icons/Animais e Sons.png', iconOutline: '/unit-icons/Animais e Sons-não iniciada.png',
   brief:'Imite os sons dos animais.',plan_c:'Animais e sons',plan_h:'Associar animal ao som',plan_e:'Sons e mímicas',plan_a:'Identificação correta',wa:'Aula 10 — Animais',questions:[{q:'Como se diz CACHORRO em inglês?',type:'mc',opts:['Dog','Cat','Fish','Lion']}]},

  {id:'u2',color:'natural',sort_order:10,title:'Compreensão Oral',sub:'Aula 11',
   icon3D: '/unit-icons/aula-2.png', iconOutline: '/unit-icons/aula-2-off.png',
   brief:'Repita DUAS vezes.',plan_c:'Compreensão oral',plan_h:'Identificar palavra-chave',plan_e:'Leitura em voz alta',plan_a:'Identificação correta',wa:'Aula 11 — Escuta em inglês',questions:[{q:'Quem cozinha em "My MOTHER cooks"?',type:'mc',opts:['Mãe','Avó','Irmã','Tia']}]},
  
  {id:'u12',color:'natural',sort_order:11,title:'Revisão do módulo',sub:'Aula 12',
   icon3D: '/unit-icons/aula-1.png', iconOutline: '/unit-icons/aula-1-off.png',
   brief:'Celebrar o progresso.',plan_c:'Revisão geral',plan_h:'Recuperar termos',plan_e:'Celebração',plan_a:'Participação ativa',wa:'Aula 12 — Revisão',questions:[{q:'Qual sua palavra favorita?',type:'text'}]}
];
