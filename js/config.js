/* =====================================================================
   VINZZI — ARQUIVO DE CONTEÚDO DO SITE
   ---------------------------------------------------------------------
   Tudo o que muda com frequência fica AQUI: WhatsApp, beats, preços,
   trabalhos, serviços, depoimentos e respostas do FAQ.

   Regras simples para editar sem quebrar nada:
   • Textos ficam sempre entre aspas: "assim".
   • Cada item termina com vírgula, menos o último da lista (pode ter também).
   • Imagens vão na pasta  img/   e áudios na pasta  audio/ .
   • Para trocar uma capa: coloque o arquivo em img/ e escreva o caminho,
     ex.: capa: "img/midnight.jpg"  (deixe "" para usar a capa provisória).
   ===================================================================== */

window.VINZZI = {

  /* ---------- CONTATO ---------------------------------------------- */
  contato: {
    // Número oficial com DDI + DDD + número, só dígitos. Ex.: "5511987654321"
    whatsapp: "5532998295935",           // (32) 99829-5935
    instagram: "https://instagram.com/m.vinzzi",
    instagramUsuario: "@m.vinzzi",
    email: "venusvinzzi@gmail.com",
  },

  /* ---------- MENSAGENS AUTOMÁTICAS DO WHATSAPP ---------------------- */
  // {nome}, {licenca} e {preco} são trocados automaticamente.
  mensagens: {
    geral: "Olá, VINZZI! Vim pelo site e gostaria de conversar sobre um projeto.",
    cta: "Olá, VINZZI! Vim pelo site e tenho um projeto em mente. Gostaria de apresentar minha ideia.",
    licenca: "Olá! Quero comprar o beat {nome} com a licença {licenca}, no valor de {preco}. Como faço para finalizar a compra?",
  },

  /* ---------- LICENÇAS DOS BEATS ------------------------------------- */
  // Aparecem na janela "Verificar licenças" de cada beat.
  // preco: número, sem "R$". Para um beat com preço diferente, use
  //        precos: { basic: 59.90 } dentro do próprio beat.
  // itens: comece com "-" o que NÃO é permitido (aparece com um X).
  licencas: [
    {
      id: "basic", nome: "Basic License", formato: "MP3", subtitulo: "Licença básica", preco: 49.90,
      itens: ["Arquivo: MP3 320 kbps", "Uso comercial permitido", "Até 50 mil streams", "Até 5 mil cópias vendidas",
              "Permitido monetizar no YouTube", "-Não permite Content ID", "Crédito obrigatório ao produtor"],
    },
    {
      id: "premium", nome: "Premium License", formato: "WAV", subtitulo: "Licença intermediária", preco: 99.90,
      itens: ["Arquivos: MP3 + WAV", "Uso comercial permitido", "Até 250 mil streams", "Até 20 mil cópias vendidas",
              "Permitido monetizar no YouTube e plataformas digitais", "-Não permite Content ID", "Crédito obrigatório ao produtor"],
    },
    {
      id: "unlimited", nome: "Unlimited License", formato: "Trackout", subtitulo: "Licença completa", preco: 249.90,
      itens: ["Arquivos: MP3 + WAV + STEMS", "Uso comercial permitido", "Streams ilimitados", "Vendas ilimitadas",
              "Monetização em plataformas digitais", "Permitido uso em videoclipes e apresentações",
              "-Não permite Content ID sem autorização específica", "Crédito obrigatório ao produtor"],
      destaque: true,
    },
  ],

  /* ---------- FOTOS DA SEÇÃO "SOBRE" (estúdio, equipamentos, DAW) ---- */
  // Deixe "" para mostrar o espaço reservado. Ex.: "img/estudio-1.jpg"
  sobreFotos: ["", ""],

  /* ---------- CATÁLOGO DE BEATS -------------------------------------- */
  // estilo: use "Trap", "Drill", "Boom Bap" ou "R&B" para cair nesses
  //         filtros. Qualquer outro estilo aparece em "Outros estilos".
  //         Deixe "" se ainda não quiser mostrar o estilo.
  // bpm/tom: opcionais (deixe "" para esconder).
  // data:   data do beat (ano-mês-dia), usada em "Mais recentes".
  // audio:  prévia em MP3 dentro da pasta audio/.
  // capa:   imagem quadrada em img/ (deixe "" para a capa provisória).
  beats: [
    { codigo: "001", nome: "Paradise",    estilo: "", bpm: "", tom: "", data: "2026-10-11", capa: "img/capa-beats.webp", audio: "audio/paradise.mp3" },
    { codigo: "002", nome: "Contenda",    estilo: "", bpm: "", tom: "", data: "2026-07-17", capa: "img/capa-beats.webp", audio: "audio/contenda.mp3" },
    { codigo: "003", nome: "San Lorenzo", estilo: "", bpm: "", tom: "", data: "2026-07-14", capa: "img/capa-beats.webp", audio: "audio/sanlorenzomilexkap.mp3" },
    { codigo: "004", nome: "Vinking",     estilo: "", bpm: "", tom: "", data: "2026-06-22", capa: "img/capa-beats.webp", audio: "audio/vinking.mp3" },
  ],

  /* ---------- TRABALHOS (PORTFÓLIO) ---------------------------------- */
  // Cada trabalho mostra o player oficial do Spotify.
  // Para adicionar: no Spotify, clique nos 3 pontinhos da música →
  // Compartilhar → Copiar link da música, e cole em  spotify: "..."
  // tipo: o que a VINZZI fez na música (aparece embaixo do player).
  trabalhos: [
    { musica: "Yabadabadoo",     tipo: "Produção de beat", spotify: "https://open.spotify.com/intl-pt/track/0XNOyyOP2V8W94GcbmosMA" },
    { musica: "Venus",           tipo: "Produção de beat", spotify: "https://open.spotify.com/intl-pt/track/42xnxmOs1GhTsaG7fT47kV" },
    { musica: "Alla Puttanesca", tipo: "Produção de beat", spotify: "https://open.spotify.com/intl-pt/track/6jomos7aagcofF8UIA8Vwl" },
    { musica: "Olhe e Aprenda",  tipo: "Produção de beat", spotify: "https://open.spotify.com/intl-pt/track/0RGYtrUQ265NGyOk8SZWL0" },
    { musica: "Ilha",            tipo: "Produção de beat", spotify: "https://open.spotify.com/intl-pt/track/2fhTatnIPUgFQeqcw0D0cA" },
    { musica: "BON VIVANT",      tipo: "Produção de beat", spotify: "https://open.spotify.com/intl-pt/track/4aRqgIdl2czRfXlaFbdG3Z" },
  ],

  /* ---------- SERVIÇOS ----------------------------------------------- */
  // Troque "R$ [VALOR]" pelo preço real. Ex.: "R$ 350"  ou  "A partir de R$ 300"
  servicos: [
    {
      numero: "01",
      titulo: "Produção de beat",
      descricao: "Criação de instrumentais personalizados, desenvolvidos de acordo com suas referências, estilo e identidade musical.",
      preco: "R$ 80",
      unidade: "por beat",
      botao: "Solicitar produção",
      mensagem: "Olá, VINZZI! Quero contratar a Produção de Beat personalizado (R$ 80). Podemos conversar sobre as referências?",
      visual: "sequenciador",
    },
    {
      numero: "02",
      titulo: "Mixagem e masterização",
      descricao: "Tratamento, equilíbrio e finalização sonora para dar mais definição e consistência à sua música.",
      preco: "R$ 100",
      unidade: "por faixa",
      botao: "Contratar mix/master",
      mensagem: "Olá, VINZZI! Quero contratar a Mixagem e Masterização (R$ 100). Como envio as faixas?",
      visual: "equalizador",
    },
    {
      numero: "03",
      titulo: "Beat + Mix + Master",
      descricao: "Uma solução completa que reúne criação do instrumental, mixagem e masterização em um único projeto.",
      preco: "R$ 170",
      unidade: "por projeto",
      botao: "Quero esse pacote",
      mensagem: "Olá, VINZZI! Quero o pacote Beat + Mix + Master (R$ 170). Podemos conversar sobre o projeto?",
      visual: "cadeia",
      destaque: true,
    },
  ],

  /* ---------- DEPOIMENTOS -------------------------------------------- */
  // ⚠️ Use SOMENTE depoimentos reais, com autorização do cliente.
  // Os itens com placeholder: true são só para mostrar o layout.
  // foto: "img/cliente.jpg" (opcional). Sem foto, aparece a inicial do nome.
  depoimentos: [
    { nome: "[Nome do cliente]", servico: "[Serviço contratado]", texto: "[Espaço reservado para o depoimento real do cliente. Substitua este texto em js/config.js.]", foto: "", placeholder: true },
    { nome: "[Nome do cliente]", servico: "[Serviço contratado]", texto: "[Espaço reservado para o depoimento real do cliente. Substitua este texto em js/config.js.]", foto: "", placeholder: true },
    { nome: "[Nome do cliente]", servico: "[Serviço contratado]", texto: "[Espaço reservado para o depoimento real do cliente. Substitua este texto em js/config.js.]", foto: "", placeholder: true },
    { nome: "[Nome do cliente]", servico: "[Serviço contratado]", texto: "[Espaço reservado para o depoimento real do cliente. Substitua este texto em js/config.js.]", foto: "", placeholder: true },
  ],

  /* ---------- FAQ ---------------------------------------------------- */
  // ⚠️ Revise as respostas: o que está entre [colchetes] precisa ser
  //    preenchido com as condições reais da VINZZI.
  faq: [
    {
      pergunta: "Como posso comprar um beat?",
      resposta: "Escolha o beat no catálogo, ouça a prévia e toque em \"Verificar licenças\". Escolha a licença (Basic, Premium ou Unlimited) e toque em \"Comprar agora\": o WhatsApp abre com o beat, a licença e o valor já preenchidos. A partir daí, combinamos os detalhes da compra diretamente com você.",
    },
    {
      pergunta: "Como funciona a produção de um beat personalizado?",
      resposta: "Você envia suas referências, o estilo que procura e a proposta da música. Alinhamos valores, prazos e condições e, então, iniciamos a produção. [Descrever aqui quantas revisões estão incluídas e o prazo médio.]",
    },
    {
      pergunta: "Posso contratar apenas mixagem e masterização?",
      resposta: "Sim. A mixagem e masterização pode ser contratada separadamente, mesmo que o beat não tenha sido produzido pela VINZZI. [Informar aqui o formato em que as faixas devem ser enviadas.]",
    },
    {
      pergunta: "Como funciona o pagamento?",
      resposta: "[Preencher com as formas de pagamento aceitas (ex.: Pix, cartão, transferência) e se há entrada ou pagamento integral antes da entrega.]",
    },
    {
      pergunta: "Como recebo o arquivo após a compra?",
      resposta: "[Preencher com a forma de entrega (ex.: link de download, e-mail ou WhatsApp) e os formatos enviados (ex.: MP3, WAV, stems).]",
    },
    {
      pergunta: "A VINZZI atende artistas de outras cidades?",
      resposta: "[Confirmar: por exemplo, \"Sim. Todo o processo pode ser feito a distância, com envio de referências e arquivos pela internet.\"]",
    },
  ],
};
