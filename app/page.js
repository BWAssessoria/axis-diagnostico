"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft, ChevronDown, ChevronRight, CheckCircle2, AlertCircle,
  Building2, MapPin, Phone, Users, BarChart3, Gem, Target, Megaphone,
  Rocket, TrendingUp, DollarSign, Settings2, Zap, Trophy, LogOut,
  LayoutDashboard, Search, Shield, Clock, Activity
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const O="#FF4500",OL="#FFF4F0",OB="#FFD4C4",G="#00C853",GL="#E8F9EF",R="#E53935",RL="#FFEBEE",Y="#FF9800",YL="#FFF8E1",B="#2196F3",BL="#E3F2FD";
const T="#2D2D2D",T2="#6B6B6B",T3="#999",BD="#E8E8E8",BG="#FAFAFA",C="#FFFFFF",IB="#F5F5F5",DK="#1A1A1A";
const TEAM_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "axis2026";

const DEMO_CLIENT = {
  _id:"demo-001",_ts:"2026-03-23T14:00:00Z",
  nome:"Dra. Camila Ferreira",nome_clinica:"CF Estética Avançada",cidade_estado:"Goiânia/GO",
  whatsapp:"(62) 99187-4420",
  equipe:"Eu (Dra. Camila) faço todos os procedimentos. Tenho uma secretária, a Jéssica, que agenda e responde o WhatsApp. Meu marido Ricardo cuida do financeiro e fornecedores. Uma auxiliar de consultório, a Paula.",
  dias_atendimento:"5",capacidade:"18",
  fat_atual:"R$ 45.000",maior_fat:"R$ 112.000 em outubro/2025",
  o_que_fez:"Em outubro fiz uma promoção forte de harmonização completa no Instagram, um antes/depois viralizou e trouxe muita gente.",
  o_que_falta:"Consistência na captação.",
  meta:"R$ 90.000",margem:"55%",
  procedimentos:"• Harmonização Orofacial completa — R$ 7.500\n• Preenchimento labial — R$ 2.200",
  carro_chefe:"Botox full face",vender_mais:"Harmonização completa.",
  ticket:"R$ 2.800",pagamento:"Pix, cartão de crédito até 12x",
  quem_resp:"Secretária/Recepcionista",tempo_resp:"5 a 30 min",max_leads:"Uns 80, acho",
  conv_aval:"3 a 4",conv_proc:"7 a 8",
  follow_up:"Às vezes",crm:"Anoto no caderno/WhatsApp",reativacao:"Não",
  instagram:"@dracamilaferreira.hof — 8.200 seguidores",
  origem:"Misto de vários",trafego:"Já rodei por 2 meses, investi R$ 1.500/mês",
  site:"Não tenho",conteudo:"Eu mesmo(a)",
  pac_desejados:"15 a 20",vol_ticket:"Menos pacientes, ticket alto",
  expect_90d:"Quero ver minha agenda lotada com pacientes de harmonização completa.",
  exp_ruim:"Contratei um gestor de tráfego freelancer por 2 meses. Não deu certo.",
  algo_mais:"Tenho vontade de abrir uma segunda unidade em Anápolis."
};

const sections = [
  { id:"clinica", title:"Sua Clínica", emoji:"🏥", sub:"O básico sobre a operação", qs:[
    {id:"nome",l:"Seu nome completo",t:"short",req:true},
    {id:"nome_clinica",l:"Nome da clínica (como aparece para o paciente)",t:"short",req:true},
    {id:"cidade_estado",l:"Cidade(s) e estado(s) onde atende",t:"short",p:"Ex: Belo Horizonte/MG e Ipatinga/MG"},
    {id:"whatsapp",l:"WhatsApp principal que recebe os leads",t:"short",p:"(00) 00000-0000",req:true},
    {id:"equipe",l:"Quem faz parte da equipe e qual o papel de cada um?",t:"long",p:"Ex: eu atendo, secretária agenda e responde WhatsApp..."},
    {id:"dias_atendimento",l:"Quantos dias por semana você atende?",t:"short"},
    {id:"capacidade",l:"Capacidade máxima de pacientes por semana (sem perder qualidade)?",t:"short"},
    {id:"tempo_clinica",l:"Há quanto tempo a clínica está em funcionamento?",t:"sel",o:["Menos de 1 ano","1 a 3 anos","3 a 5 anos","5 a 10 anos","Mais de 10 anos"]},
    {id:"hof_foco",l:"A clínica é focada exclusivamente em HOF ou atende outros procedimentos?",t:"sel",o:["Exclusivamente HOF","HOF + outros procedimentos","HOF é uma área nova pra mim"]},
  ]},
  { id:"fat", title:"Faturamento", emoji:"📊", sub:"Onde você está e onde já chegou", qs:[
    {id:"fat_atual",l:"Faturamento médio mensal atual",t:"short",p:"R$",req:true},
    {id:"maior_fat",l:"Maior faturamento mensal já atingido (valor e quando)",t:"short",p:"Ex: R$ 170k em nov/2025"},
    {id:"o_que_fez",l:"O que fez de diferente naquele mês pra bater esse número?",t:"long",p:"Campanhas, promoções, indicações..."},
    {id:"o_que_falta",l:"O que falta pra esse resultado virar o padrão?",t:"long"},
    {id:"meta",l:"Meta de faturamento mensal pra 2026",t:"short",p:"R$"},
    {id:"margem",l:"Margem de lucro aproximada nos procedimentos",t:"short",p:"Ex: 60%, ou 'não sei'"},
    {id:"fat_6m",l:"Faturamento dos últimos 6 meses (mês a mês)",t:"long_xl",p:"Ex:\nJan: R$ 40.000\nFev: R$ 38.000\nMar: R$ 52.000\nAbr: R$ 47.000\nMai: R$ 55.000\nJun: R$ 49.000"},
    {id:"fat_tendencia",l:"O faturamento tem crescido, caído ou ficado estável nos últimos meses?",t:"sel",o:["Crescendo","Estável","Caindo","Oscilando muito"]},
    {id:"sazonalidade",l:"Quais são os meses melhores e piores da sua clínica?",t:"long",p:"Ex: Melhores: outubro e novembro. Piores: janeiro e julho."},
    {id:"investimento_mkt",l:"Reinveste quanto do faturamento em marketing atualmente?",t:"sel",o:["Nada no momento","Menos de 3%","Entre 3% e 7%","Entre 7% e 15%","Mais de 15%","Não sei"]},
  ]},
  { id:"serv", title:"Serviços", emoji:"💎", sub:"O que oferece e como cobra", qs:[
    {id:"procedimentos",l:"Principais procedimentos e preço de cada um",t:"long_xl",p:"Ex:\n• Harmonização completa — R$ 8.000\n• Preenchimento labial — R$ 2.500"},
    {id:"carro_chefe",l:"Procedimento carro-chefe (o que mais vende)",t:"short"},
    {id:"vender_mais",l:"Procedimento que quer vender mais e por quê?",t:"long"},
    {id:"ticket",l:"Ticket médio por paciente",t:"short",p:"R$"},
    {id:"pagamento",l:"Formas de pagamento oferecidas",t:"short",p:"Pix, cartão, parcelamento..."},
    {id:"orcamento_formato",l:"Como você apresenta o orçamento — presencial, online ou os dois?",t:"sel",o:["Só presencial (na consulta)","Online (por WhatsApp/e-mail)","Os dois","Ainda não tenho processo definido"]},
  ]},
  { id:"com", title:"Comercial", emoji:"🎯", sub:"Do lead ao procedimento", qs:[
    {id:"quem_resp",l:"Quem responde o WhatsApp da clínica?",t:"sel",o:["Eu mesmo(a)","Secretária/Recepcionista","Sócio(a)","Mais de uma pessoa","Chatbot + pessoa"]},
    {id:"tempo_resp",l:"Tempo médio de resposta ao lead",t:"sel",o:["Menos de 5 min","5 a 30 min","30 min a 2h","Mais de 2h","Varia muito"]},
    {id:"max_leads",l:"Máximo de leads já recebidos no WhatsApp em um mês",t:"short",p:"Ex: 150, ou 'não sei'"},
    {id:"conv_aval",l:"De cada 10 leads, quantos agendam avaliação?",t:"sel",o:["1 a 2","3 a 4","5 a 6","7 a 8","Mais de 8","Não sei"]},
    {id:"conv_proc",l:"De cada 10 avaliações, quantas viram procedimento?",t:"sel",o:["1 a 2","3 a 4","5 a 6","7 a 8","Mais de 8","Não sei"]},
    {id:"follow_up",l:"Faz follow-up com quem não agendou?",t:"sel",o:["Sim, sempre","Às vezes","Raramente","Nunca"]},
    {id:"crm",l:"Usa algum sistema pra gerenciar leads?",t:"sel",o:["CRM (Kommo, Pipedrive...)","Planilha","Anoto no caderno/WhatsApp","Nenhum controle"]},
    {id:"reativacao",l:"Faz ação pra reativar pacientes antigos?",t:"sel",o:["Sim, regularmente","De vez em quando","Não"]},
    {id:"script_whats",l:"Tem script de atendimento definido para o WhatsApp?",t:"sel",o:["Sim, seguimos um roteiro","Mais ou menos, é informal","Não, cada um responde do seu jeito"]},
    {id:"quem_fecha",l:"Após a avaliação, quem apresenta o plano de tratamento e fecha o paciente?",t:"sel",o:["Eu mesmo(a) (dentista)","Coordenador(a) comercial","Secretária/Recepcionista","Não temos esse processo definido"]},
    {id:"motivo_perda",l:"Qual é o maior motivo de perda de lead hoje?",t:"sel",o:["Demora no atendimento","Preço / falta de financiamento","Lead sem perfil (não qualificado)","Paciente foi pra concorrência","Não faço acompanhamento","Não sei"]},
    {id:"tempo_fechamento",l:"Quanto tempo leva em média do primeiro contato ao fechamento?",t:"sel",o:["Na mesma semana","1 a 2 semanas","1 mês","Mais de 1 mês","Não sei"]},
    {id:"dias_atend",l:"Você atende de segunda a sábado ou só dias de semana?",t:"sel",o:["Segunda a sexta","Segunda a sábado","Apenas alguns dias da semana","Varia"]},
    {id:"conforto_preco",l:"Você ou sua equipe se sentem confortáveis em falar de preço no primeiro contato?",t:"sel",o:["Sim, totalmente","Mais ou menos","Não, preferimos chamar pra avaliação primeiro"]},
    {id:"diferencial",l:"Tem alguma garantia ou diferencial que você comunica ao paciente na consulta?",t:"long",p:"Ex: garantia de 5 anos, planejamento digital, segunda opinião gratuita..."},
    {id:"objecoes",l:"Quais objeções mais recebe dos pacientes antes de fechar?",t:"long",p:"Ex: preço alto, medo do procedimento, quer pesquisar mais, precisa consultar o cônjuge..."},
  ]},
  { id:"mkt", title:"Marketing", emoji:"📱", sub:"O que já roda hoje", qs:[
    {id:"instagram",l:"@ do Instagram principal e nº de seguidores",t:"short",p:"@dra.fulana — 5.000 seguidores"},
    {id:"origem",l:"De onde vem a maioria dos pacientes?",t:"sel",o:["Instagram (orgânico)","Indicação / boca a boca","Google (pesquisa)","Anúncios pagos","TikTok","Misto de vários"]},
    {id:"trafego",l:"Roda anúncios pagos? Quanto investe/mês?",t:"short",p:"Ex: Sim, R$ 2.000/mês no Meta Ads"},
    {id:"site",l:"Tem site? Qual a URL?",t:"short",p:"www.suaclinica.com.br ou 'não tenho'"},
    {id:"conteudo",l:"Quem cuida do conteúdo do Instagram?",t:"sel",o:["Eu mesmo(a)","Social media/freelancer","Agência","Sócio(a)","Ninguém — está parado"]},
    {id:"freq_posts",l:"Quantos posts por semana publica no Instagram em média?",t:"sel",o:["Nenhum (está parado)","1 a 2 por semana","3 a 4 por semana","5 ou mais por semana"]},
    {id:"google_ads",l:"Já testou Google Ads? Como foi?",t:"long",p:"Se nunca usou, escreva 'nunca testei'."},
    {id:"landing_page",l:"Usa landing page para captar leads dos anúncios ou manda direto pro Instagram?",t:"sel",o:["Tenho landing page própria","Mando pro Instagram","Mando direto pro WhatsApp","Não rodo anúncios"]},
    {id:"pixel_meta",l:"Tem pixel do Meta instalado e configurado no seu site ou landing page?",t:"sel",o:["Sim, está ativo e configurado","Sim, mas não sei se está funcionando certo","Não tenho","Não sei o que é isso"]},
    {id:"gmn",l:"Tem conta no Google Meu Negócio ativa? Quantas avaliações?",t:"short",p:"Ex: Sim, 45 avaliações / Não tenho"},
    {id:"tiktok",l:"Está presente no TikTok? Quantos seguidores?",t:"short",p:"Ex: @dra.fulana — 3.200 seguidores / Não tenho"},
    {id:"influencer",l:"Já fez parceria com influenciador ou médico de referência para divulgação?",t:"sel",o:["Sim, com bons resultados","Sim, mas sem resultado claro","Não, mas tenho interesse","Não tenho interesse"]},
    {id:"captacao_aval",l:"Tem estratégia ativa para captar avaliações no Google ou Instagram?",t:"sel",o:["Sim, pedimos ativamente","Às vezes pedimos","Não, as avaliações vêm espontaneamente","Não temos avaliações"]},
    {id:"campanha_indicacao",l:"Já fez campanha de indicação (paciente indica e ganha benefício)?",t:"sel",o:["Sim, regularmente","Já tentei uma vez","Não, mas quero tentar","Não tenho interesse"]},
    {id:"estrategia_conteudo",l:"O conteúdo postado hoje segue alguma estratégia ou é aleatório?",t:"sel",o:["Seguimos um calendário e estratégia definida","Tem alguma lógica, mas é informal","É aleatório, posto quando lembro","Não postamos nada"]},
    {id:"identidade_visual",l:"Tem identidade visual definida (paleta de cores, fonte, tom de voz)?",t:"sel",o:["Sim, tudo definido e aplicado","Parcialmente","Não, cada post fica diferente","Nunca pensei nisso"]},
    {id:"site_detalhes",l:"Se tem site, qual a URL? Ele captura leads ou é só institucional?",t:"short",p:"Ex: www.clinicafullarch.com.br — captura leads / Não tenho site"},
  ]},
  { id:"visao", title:"Visão e Expectativas", emoji:"🚀", sub:"O que espera dessa parceria", qs:[
    {id:"pac_desejados",l:"Quantos pacientes novos/mês quer via tráfego pago?",t:"short"},
    {id:"vol_ticket",l:"Prefere volume ou seletividade?",t:"sel",o:["Mais pacientes, ticket médio","Menos pacientes, ticket alto","Equilíbrio dos dois"]},
    {id:"expect_90d",l:"O que espera nos primeiros 90 dias com a AXIS?",t:"long",p:"Quanto mais clara a expectativa, melhor a gente entrega"},
    {id:"exp_ruim",l:"Já trabalhou com agência/gestor de tráfego? O que deu errado?",t:"long",p:"Se nunca trabalhou, escreva 'primeira vez'"},
    {id:"algo_mais",l:"Mais alguma coisa importante que a gente precisa saber?",t:"long",p:"Pode ser qualquer coisa..."},
    {id:"medo_assessoria",l:"Qual é o seu maior medo ao contratar uma assessoria de marketing?",t:"long",p:"Pode ser honesto(a). Essa resposta nos ajuda a alinhar expectativas."},
    {id:"nivel_mkt",l:"Você se considera atualizado(a) sobre marketing digital para clínicas?",t:"sel",o:["Sim, acompanho bastante","Tenho noção básica","Pouco, prefiro focar na clínica","Não sei quase nada sobre o assunto"]},
    {id:"tempo_mkt",l:"Quanto tempo por semana você dedica para pensar em marketing?",t:"sel",o:["Menos de 1h","1 a 3h","3 a 5h","Mais de 5h","Não dedico tempo, deixo pra terceiros"]},
    {id:"aparecer_conteudo",l:"Você está disposto(a) a aparecer no conteúdo (reels, stories, bastidores)?",t:"sel",o:["Sim, totalmente","Sim, com moderação","Prefiro que o foco seja na clínica, não em mim","Não me sinto confortável"]},
    {id:"resultado_renovacao",l:"Qual seria o resultado dos primeiros 90 dias que te faria renovar o contrato?",t:"long",p:"Seja específico(a): número de leads, casos fechados, faturamento..."},
    {id:"autorizacao_pacientes",l:"Seus pacientes autorizam o uso de fotos e vídeos para divulgação?",t:"sel",o:["Sim, assino termo de autorização","Peço verbalmente mas não documento","Raramente peço","Não tenho esse processo"]},
    {id:"disponibilidade_conteudo",l:"Tem disponibilidade para produção de conteúdo na clínica (receber equipe ou gravar)?",t:"sel",o:["Sim, sem problema","Consigo 1 a 2 vezes por mês","Tenho dificuldade de agenda","Prefiro não receber equipe"]},
  ]},
];

const allQs=sections.flatMap(s=>s.qs);
const totalQ=allQs.length;

// ============ ANALYSIS ENGINE ============

const pm = v => { if(!v) return 0; const n=String(v).replace(/[^\d.,]/g,"").replace(/\./g,"").replace(",","."); return parseFloat(n)||0; };
const fmtR = v => v>0 ? `R$ ${v.toLocaleString("pt-BR")}` : "—";

const nivelFn = pct => {
  if(pct>=80) return {label:"Excelente",color:G,bg:GL};
  if(pct>=60) return {label:"Bom",color:B,bg:BL};
  if(pct>=40) return {label:"Atenção",color:Y,bg:YL};
  return {label:"Crítico",color:R,bg:RL};
};

function buildComercialAnalysis(a) {
  const fortes=[], fracos=[], acoes=[];
  const tr=a.tempo_resp||"";
  if(tr.includes("Menos de 5")) fortes.push("Velocidade de resposta excepcional (< 5 min) — vantagem competitiva real. A maioria dos leads decide em menos de 10 minutos quem vai atender.");
  else if(tr.includes("5 a 30")) fortes.push("Tempo de resposta adequado (5-30 min) — dentro da janela aceitável, mas há espaço para melhorar.");
  else if(tr.includes("30 min")||tr.includes("Mais de 2h")||tr.includes("Varia")) {
    fracos.push("Tempo de resposta acima de 30 minutos — 78% dos leads fecha com a primeira clínica que responde. Cada minuto de atraso é receita perdida.");
    acoes.push({tag:"URGENTE",texto:"Definir responsável exclusivo pelo WhatsApp com meta de resposta em até 5 minutos em horário comercial. Implementar mensagem automática de boas-vindas (via WhatsApp Business) para os fora do horário, com expectativa de retorno clara.",prazo:"Semana 1",impacto:"Alto"});
  }
  const ca=a.conv_aval||"";
  if(ca.includes("7 a 8")||ca.includes("Mais de 8")) fortes.push("Taxa de conversão lead → avaliação acima de 70% — script de atendimento eficaz e posicionamento claro.");
  else if(ca.includes("5 a 6")) fortes.push("Taxa de conversão lead → avaliação razoável (50-60%). Com refinamento do script, pode chegar a 70%+.");
  else if(ca.includes("3 a 4")||ca.includes("1 a 2")) {
    fracos.push(`Taxa de conversão lead → avaliação de apenas ${ca.toLowerCase()} em cada 10 — abaixo do benchmark de mercado (5+ por 10). Problema claro no script ou na qualificação do lead.`);
    acoes.push({tag:"PRIORITÁRIA",texto:"Criar script estruturado de atendimento com 4 etapas: (1) Acolhimento e qualificação (procedimento de interesse, expectativa, localidade), (2) Apresentação de autoridade e prova social, (3) Proposta de valor da avaliação, (4) Fechamento da agenda com data e hora específicas. Evitar 'quando você puder' — oferecer 2 opções de horário.",prazo:"Semana 1-2",impacto:"Alto"});
  }
  const cp=a.conv_proc||"";
  if(cp.includes("7 a 8")||cp.includes("Mais de 8")) fortes.push("Alta taxa de conversão avaliação → procedimento — consulta bem conduzida e técnica de fechamento eficaz.");
  else if(cp.includes("3 a 4")||cp.includes("1 a 2")) {
    fracos.push("Taxa de conversão avaliação → procedimento abaixo de 50% — pacientes saem da consulta sem fechar. Perda de receita que já custou aquisição do lead e tempo da profissional.");
    acoes.push({tag:"PRIORITÁRIA",texto:"Reestruturar protocolo da consulta: (1) Diagnóstico visual (mostrar o problema com espelho/foto), (2) Apresentação da solução com fotos de antes/depois de casos similares, (3) Plano de tratamento numerado e personalizado, (4) Apresentação do investimento com foco no resultado, não no preço, (5) Facilitar decisão com parcelamento visível e prazo de validade da proposta.",prazo:"Semana 2-3",impacto:"Alto"});
  } else if(cp.includes("5 a 6")) fortes.push("Taxa de conversão avaliação → procedimento acima de 50% — base sólida para otimizar.");
  const fu=a.follow_up||"";
  if(fu.includes("sempre")) fortes.push("Follow-up sistemático — bom aproveitamento do pipeline. Leads são ativos, não desistentes.");
  else if(fu.includes("Nunca")||fu.includes("Raramente")) {
    fracos.push("Ausência de follow-up — estatisticamente, 80% das vendas acontecem entre o 5º e 12º contato. Sem follow-up, essa receita vai para o concorrente.");
    acoes.push({tag:"RÁPIDA EXECUÇÃO",texto:"Criar cadência de follow-up para leads não convertidos: D+1 (confirmar interesse e tirar dúvida), D+3 (compartilhar resultado de caso similar), D+7 (criar urgência com disponibilidade limitada ou benefício exclusivo). Automatizar com CRM para garantir consistência.",prazo:"Semana 2",impacto:"Médio-Alto"});
  }
  const crm=a.crm||"";
  if(crm.includes("CRM")) fortes.push("CRM ativo — estrutura para rastrear, medir e escalar o processo comercial com previsibilidade.");
  else if(crm.includes("caderno")||crm.includes("Nenhum")) {
    fracos.push("Sem sistema de gestão de leads — impossível saber quantos leads chegaram, quantos converteram e onde estão vazando. Escalar sem CRM é escalar no escuro.");
    acoes.push({tag:"ESTRUTURAL",texto:"Implementar Kommo (recomendado para clínicas) ou similar. Configurar funil: Novo Lead → Em Atendimento → Avaliação Agendada → Avaliação Realizada → Proposta Enviada → Fechado → Perdido. Toda a equipe precisa alimentar o sistema — o que não está no CRM não existe.",prazo:"Semana 1-2",impacto:"Alto"});
  }
  const reat=a.reativacao||"";
  if(reat.includes("regularmente")) fortes.push("Estratégia de reativação ativa — excelente aproveitamento da base instalada, que já confia na profissional.");
  else if(reat.includes("Não")) {
    fracos.push("Pacientes antigos sem reativação — essa é a fonte de receita mais barata e rápida disponível. Custo de reativação é até 5x menor que captação de paciente novo.");
    acoes.push({tag:"RÁPIDA EXECUÇÃO",texto:"Mapear todos os pacientes dos últimos 12-18 meses sem retorno. Criar campanha de reativação via WhatsApp personalizada: mencionar o procedimento que fizeram, sugerir manutenção ou procedimento complementar, oferecer condição especial com prazo. Meta: converter 15-20% da base em consulta nos próximos 30 dias.",prazo:"Semana 3-4",impacto:"Alto"});
  }
  if((a.quem_fecha||"").includes("Não temos")) {
    fracos.push("Processo de fechamento não definido — conversão depende do improviso de cada atendimento, gerando resultados inconsistentes.");
    acoes.push({tag:"PROCESSO",texto:"Definir responsável pelo fechamento e criar protocolo padrão de apresentação do plano de tratamento. Quem faz a consulta deve ser treinado para conduzir o fechamento — ou criar a figura de uma coordenadora comercial.",prazo:"Semana 2-3",impacto:"Médio"});
  }
  if((a.objecoes||"").toLowerCase().includes("preço")) {
    acoes.push({tag:"VENDAS",texto:"Criar material de suporte para contorno de objeção de preço: comparativo visual do investimento vs. resultado (ex: preço de uma viagem vs. autoestima permanente), apresentar parcelamento proativamente antes da objeção surgir, e ter opção de entrada + parcelamento no cartão como alternativa.",prazo:"Semana 2-3",impacto:"Médio"});
  }
  return {fortes,fracos,acoes};
}

function buildMarketingAnalysis(a) {
  const fortes=[], fracos=[], acoes=[];
  const temTrafego = a.trafego && !a.trafego.toLowerCase().includes("não") && a.trafego.trim().length>2;
  if(temTrafego) {
    fortes.push("Tráfego pago ativo — canal de aquisição escalável em operação. Base para crescimento previsível.");
    const invNum=pm(a.trafego);
    if(invNum>0 && invNum<2000) {
      fracos.push(`Investimento em tráfego de ${fmtR(invNum)}/mês está abaixo do mínimo recomendado para resultados consistentes em HOF no Meta Ads (mínimo R$ 2.500-3.000/mês).`);
      acoes.push({tag:"ESCALAR",texto:`Aumentar budget progressivamente: R$ 3.000/mês no mês 1, R$ 5.000 no mês 2 se CPL estiver saudável. Distribuição: 60% campanhas de conversão (leads), 30% remarketing, 10% topo de funil (awareness). Só escalar após pixel configurado e landing page no ar.`,prazo:"Mês 1",impacto:"Alto"});
    }
  } else {
    fracos.push("Sem tráfego pago ativo — crescimento 100% orgânico é imprevisível, não escalável e não permite atingir a meta em 90 dias.");
    acoes.push({tag:"URGENTE",texto:"Iniciar campanhas no Meta Ads (Facebook/Instagram) com budget inicial de R$ 2.500/mês. Estrutura recomendada: 1 campanha de geração de leads para avaliação gratuita no procedimento carro-chefe, segmentação por interesse (estética, beleza) + lookalike de clientes atuais. Não rodar sem pixel e landing page configurados.",prazo:"Semana 1-2",impacto:"Alto"});
  }
  const lp=a.landing_page||"";
  if(lp.includes("landing page própria")) fortes.push("Landing page dedicada — possibilidade real de medir CPL, testar criativos e otimizar conversão com dados.");
  else if(!lp.includes("landing page")) {
    fracos.push("Sem landing page — tráfego sendo jogado direto no Instagram ou WhatsApp. Impossível medir CPL real, fazer testes A/B ou criar públicos de remarketing eficazes.");
    acoes.push({tag:"URGENTE",texto:"Criar landing page de captação focada no procedimento carro-chefe com: headline de transformação (não de procedimento), prova social (3-5 fotos de antes/depois com depoimento), formulário simples (nome + WhatsApp), CTA direto ('Quero minha avaliação') e sem menu de navegação para não distrair. Ferramentas: Framer, Webflow ou HighLevel.",prazo:"Semana 1-2",impacto:"Alto"});
  }
  const pxl=a.pixel_meta||"";
  if(pxl.includes("ativo e configurado")) fortes.push("Pixel do Meta ativo e configurado — dados de audiência sendo coletados, base para otimização de campanhas e criação de lookalike.");
  else {
    fracos.push("Pixel do Meta não configurado — anúncios rodando sem dados de otimização. Sem pixel, o algoritmo do Meta não consegue aprender quem converte, desperdiçando até 40% do budget.");
    acoes.push({tag:"TÉCNICA",texto:"Instalar Pixel do Meta no site/landing page via Google Tag Manager. Configurar eventos: ViewContent (visitou a página), Lead (preencheu formulário), Contact (clicou no WhatsApp). Verificar funcionamento com Meta Pixel Helper. Isso permite criar públicos de remarketing e lookalike audiences que reduzem o CPL significativamente.",prazo:"Semana 1",impacto:"Alto"});
  }
  const ig=a.instagram||"";
  if(ig.length>5) {
    const m=ig.match(/(\d[\d.]*)/);
    const segs=m?parseInt(m[1].replace(/\D/g,""))||0:0;
    if(segs>=5000) fortes.push(`Perfil no Instagram com ${segs.toLocaleString("pt-BR")} seguidores — autoridade digital relevante para converter tráfego orgânico e dar credibilidade aos anúncios.`);
    else if(segs>=1000) fortes.push("Perfil ativo no Instagram com presença digital estabelecida — base para crescimento orgânico e prova social nos anúncios.");
    else fracos.push("Perfil com poucos seguidores — trabalhar conteúdo de autoridade junto ao tráfego pago para aumentar credibilidade.");
  }
  const econt=a.estrategia_conteudo||"";
  const freq=a.freq_posts||"";
  if(econt.includes("calendário")&&(freq.includes("3 a 4")||freq.includes("5 ou mais"))) {
    fortes.push("Estratégia de conteúdo estruturada com frequência consistente — ativo valioso para conversão orgânica e aumento do alcance.");
  } else if(econt.includes("aleatório")||freq.includes("Nenhum")||econt.includes("Não postamos")) {
    fracos.push("Conteúdo aleatório ou ausente — Instagram funcionando como vitrine fechada, incapaz de educar, construir autoridade e converter leads.");
    acoes.push({tag:"CONTEÚDO",texto:"Implementar calendário editorial com 4 pilares semanais: (1) Educação — o que é o procedimento, quem é candidato; (2) Prova social — resultados reais com antes/depois (com autorização); (3) Bastidores — humanização da profissional, rotina, bastidores do procedimento; (4) Chamada para ação — convite direto para avaliação. Meta: 5 posts/semana + stories diários. Gravar conteúdo em lote (1 dia/mês).",prazo:"Mês 1",impacto:"Médio-Alto"});
  }
  const gmn=a.gmn||"";
  if(!gmn||gmn.toLowerCase().includes("não tenho")) {
    fracos.push("Sem Google Meu Negócio — invisível para quem pesquisa 'harmonização facial [cidade]' no Google. Tráfego local qualificado e gratuito sendo perdido.");
    acoes.push({tag:"RÁPIDA EXECUÇÃO",texto:"Criar e verificar conta no Google Meu Negócio em até 7 dias. Adicionar fotos profissionais da clínica e procedimentos, horários, lista de serviços e descrição com palavras-chave locais. Criar estratégia de captação de avaliações: pedir no pós-procedimento com link direto. Meta: 20 avaliações 5 estrelas nos primeiros 60 dias.",prazo:"Semana 1",impacto:"Médio"});
  } else fortes.push("Google Meu Negócio ativo — presença no Google Search e Maps para buscas locais com intenção de compra.");
  const gads=a.google_ads||"";
  if(!gads||gads.toLowerCase().includes("nunca")) {
    acoes.push({tag:"OPORTUNIDADE",texto:"Testar Google Ads com campanhas de pesquisa para termos de alta intenção: 'harmonização facial [cidade]', 'botox preço [cidade]', 'clínica HOF [cidade]'. CPL tende a ser menor que Meta Ads para procedimentos de alto ticket pois o paciente está ativamente buscando. Budget inicial: R$ 800-1.200/mês.",prazo:"Mês 2",impacto:"Alto"});
  }
  if((a.captacao_aval||"").includes("Não temos avaliações")||(a.captacao_aval||"").includes("espontaneamente")) {
    acoes.push({tag:"REPUTAÇÃO",texto:"Criar processo sistemático de captação de avaliações no Google: no pós-procedimento, enviar mensagem pelo WhatsApp com link direto para avaliação Google (goo.gl/maps link). Incentivar com mensagem personalizada agradecendo o resultado. Avaliações aumentam CTR nos anúncios do Google e credibilidade da landing page.",prazo:"Semana 2",impacto:"Médio"});
  }
  return {fortes,fracos,acoes};
}

function buildOperacionalAnalysis(a) {
  const fortes=[], fracos=[], acoes=[];
  const equipe=a.equipe||"";
  if(equipe.length>80) fortes.push("Equipe estruturada com papéis definidos — base para delegar e escalar sem criar gargalo na profissional principal.");
  else if(equipe.length<30||equipe.toLowerCase().includes("só eu")||equipe.toLowerCase().includes("sozinha")) {
    fracos.push("Operação centralizada na profissional — ela é médica, secretária e gestora ao mesmo tempo. Esse gargalo impede o crescimento e compromete a qualidade do atendimento.");
    acoes.push({tag:"ESTRUTURAL",texto:"Mapear imediatamente quais atividades podem ser delegadas: atendimento no WhatsApp, agendamento, confirmação de consultas, envio de follow-up. Contratar ou treinar alguém para essas funções antes de escalar o tráfego — de nada adianta gerar leads se não há capacidade de atender.",prazo:"Mês 1",impacto:"Alto"});
  }
  const cap=parseInt(a.capacidade)||0;
  if(cap>=15) fortes.push(`Capacidade operacional de ${cap} pacientes/semana — suficiente para absorver o crescimento projetado sem queda de qualidade.`);
  else if(cap>0&&cap<10) {
    fracos.push(`Capacidade máxima de ${cap} pacientes/semana pode se tornar um gargalo à medida que o tráfego pago escala e a agenda enche.`);
    acoes.push({tag:"PLANEJAMENTO",texto:"Revisar agenda e identificar slots subutilizados (horários vazios, dias com baixo volume). Avaliar extensão de horário ou adição de um dia de atendimento. Planejar capacidade antes de escalar — não adianta gerar 50 leads se a agenda comporta apenas 8 novos pacientes.",prazo:"Mês 1",impacto:"Médio"});
  }
  const aut=a.autorizacao_pacientes||"";
  if(aut.includes("termo")) fortes.push("Termo de autorização de uso de imagem — proteção jurídica e liberdade total para usar resultados reais no marketing, que são o maior driver de conversão em HOF.");
  else if(aut.includes("Não tenho")||aut.includes("Raramente")) {
    fracos.push("Sem processo de autorização de imagem — impossibilita o uso de fotos de resultados reais, que são o conteúdo de maior conversão em procedimentos estéticos. Risco jurídico associado.");
    acoes.push({tag:"LEGAL/MARKETING",texto:"Criar termo de autorização de uso de imagem em conformidade com CFM (incluir nome, procedimento, finalidade de uso). Implementar como etapa padrão pós-procedimento. Paralelamente, criar protocolo fotográfico: iluminação, ângulo e enquadramento padronizados antes e depois de cada caso. Esse banco de imagens é ativo de marketing de longo prazo.",prazo:"Semana 1-2",impacto:"Alto"});
  }
  const disp=a.disponibilidade_conteudo||"";
  if(disp.includes("sem problema")) fortes.push("Disponibilidade para produção de conteúdo na clínica — permite criar vídeos autênticos de procedimentos, bastidores e depoimentos, que têm alta conversão.");
  else if(disp.includes("dificuldade")||disp.includes("Prefiro não")) {
    fracos.push("Dificuldade de agenda para produção de conteúdo — limitará a qualidade e autenticidade do marketing de vídeo, que é o formato de maior alcance no Instagram em 2025-26.");
    acoes.push({tag:"ORGANIZAÇÃO",texto:"Reservar um período fixo por mês para produção de conteúdo em lote (ex: primeira terça-feira das 7h-12h). Em um único dia: gravar 8-12 vídeos curtos, fotografar procedimentos com autorização, gravar depoimentos de pacientes presentes. Eficiência de escala: preparar uma vez, publicar por 30 dias.",prazo:"Mês 1",impacto:"Médio"});
  }
  const orc=a.orcamento_formato||"";
  if(orc.includes("Ainda não tenho")) {
    fracos.push("Processo de apresentação de orçamento não padronizado — experiência do paciente inconsistente e menor taxa de fechamento por falta de profissionalismo percebido.");
    acoes.push({tag:"PROCESSO",texto:"Criar modelo padrão de apresentação de orçamento: documento visual (PDF no iPad ou tablet) com nome do paciente, diagnóstico personalizado com foto, plano de tratamento em etapas, investimento total e parcelado, formas de pagamento aceitas e prazo de validade da proposta. Apresentar sempre presencialmente quando possível — taxa de fechamento é 3x maior.",prazo:"Semana 2-3",impacto:"Médio"});
  } else if(orc.includes("Os dois")) fortes.push("Flexibilidade no formato de apresentação do orçamento — adaptação ao perfil de cada paciente.");
  return {fortes,fracos,acoes};
}

function buildFinanceiroAnalysis(a) {
  const fortes=[], fracos=[], acoes=[];
  const fatA=pm(a.fat_atual), fatMaior=pm(a.maior_fat), tick=pm(a.ticket), margem=a.margem||"", inv=a.investimento_mkt||"", tend=a.fat_tendencia||"";
  if(tend.includes("Crescendo")) fortes.push("Tendência de crescimento — negócio em trajetória positiva. Momentum favorável para escalar com marketing.");
  else if(tend.includes("Caindo")) {
    fracos.push("Faturamento em queda — situação que exige intervenção imediata. Crescer com tráfego pago em cima de um funil com vazamento é ineficiente.");
    acoes.push({tag:"URGENTE",texto:"Antes de escalar tráfego, identificar a causa raiz da queda: sazonalidade, perda de pacientes recorrentes, problema comercial ou aumento de concorrência. Priorizar campanha de reativação de base (mais barata e rápida) para estabilizar o faturamento enquanto o tráfego pago é estruturado.",prazo:"Semana 1",impacto:"Alto"});
  } else if(tend.includes("Oscilando")) {
    fracos.push("Faturamento instável — indica captação não sistemática, sem recorrência. Meses bons e ruins dependem de fatores externos ou esforços pontuais.");
  }
  if(fatA>0&&fatMaior>0&&fatMaior>fatA*1.4) {
    fortes.push(`Já comprovou capacidade de faturar ${fmtR(fatMaior)} — o teto existe e está provado. A questão é transformar o pico em padrão.`);
    acoes.push({tag:"ESTRATÉGICA",texto:`O mês de ${fmtR(fatMaior)} foi uma prova de conceito. Analisar em detalhe: que campanha rodou? Qual procedimento liderou? Que canal trouxe mais leads? Replicar sistematicamente essas condições todos os meses — isso é o que a AXIS vai ajudar a fazer com consistência.`,prazo:"Mês 1",impacto:"Alto"});
  }
  if(tick>=4000) fortes.push(`Ticket médio de ${fmtR(tick)} — posicionamento premium sólido. Cada paciente novo representa receita significativa, justificando investimento maior em captação.`);
  else if(tick>0&&tick<2000) {
    fracos.push(`Ticket médio de ${fmtR(tick)} — abaixo do ideal para clínicas HOF premium. Reposicionamento ou estratégia de upsell podem dobrar a receita por paciente sem precisar dobrar o volume.`);
    acoes.push({tag:"POSICIONAMENTO",texto:"Trabalhar venda de pacotes completos (ex: harmonização total) ao invés de procedimentos avulsos. Criar protocolos de manutenção que transformem paciente pontual em paciente recorrente. Revisar posicionamento de preço: preço baixo atrai perfil de paciente que negocia e não retorna.",prazo:"Mês 1-2",impacto:"Alto"});
  } else if(tick>=2000) fortes.push(`Ticket médio de ${fmtR(tick)} — base saudável para um modelo de negócio com boa margem por procedimento.`);
  if(!margem||margem.toLowerCase().includes("não sei")) {
    fracos.push("Margem de lucro desconhecida — impossível tomar decisões de precificação, investimento e crescimento sem clareza dos números reais do negócio.");
    acoes.push({tag:"FINANCEIRO",texto:"Calcular custo real de cada procedimento: insumos + tempo da profissional (valor/hora) + estrutura proporcional + impostos. Garantir margem mínima de 55% por procedimento. Construir DRE simplificado mensal: receita, custo de procedimentos, custos fixos, marketing e lucro líquido. Só com esse mapa é possível crescer com saúde.",prazo:"Mês 1",impacto:"Médio"});
  } else fortes.push(`Margem conhecida (${margem}) — gestão financeira consciente. Base para decisões de precificação e investimento com clareza.`);
  if(inv.includes("Nada")) {
    fracos.push("Sem reinvestimento em marketing — crescimento depende exclusivamente de indicação e orgânico. Não escalável, não previsível, não suficiente para atingir a meta em 90 dias.");
    acoes.push({tag:"ESTRATÉGICA",texto:"Definir percentual fixo de reinvestimento em marketing como custo fixo do negócio (recomendado: 8-12% do faturamento para fase de crescimento acelerado). Tratar como qualquer outro insumo — investimento com retorno mensurável, não gasto.",prazo:"Mês 1",impacto:"Alto"});
  } else if(inv.includes("Menos de 3")) {
    fracos.push("Reinvestimento em marketing abaixo de 3% — insuficiente para crescimento acelerado. Clínicas em fase de escala bem-sucedidas investem entre 8-15% do faturamento.");
  } else if(inv.includes("7% e 15")||inv.includes("Mais de 15")) fortes.push("Reinvestimento em marketing saudável — mentalidade de crescimento ativa e proporção adequada para escalar.");
  return {fortes,fracos,acoes};
}

function buildDiagnostico(k, pct, data) {
  const nome = data.nome_clinica||"a clínica";
  if(k==="comercial") {
    if(pct>=75) return `O funil comercial de ${nome} está bem estruturado, com ${pct}% do potencial ativado. Os fundamentos de velocidade de resposta e conversão estão presentes. O foco agora deve ser refinamento: scripts mais precisos, CRM bem calibrado e uma estratégia de reativação sistemática que monetize a base de pacientes existente — a fonte de receita mais rápida e barata.`;
    if(pct>=50) return `O comercial de ${nome} tem bases, mas perde pacientes em pontos críticos do funil. Com ${pct}% do potencial ativado, existem gaps de processo que, corrigidos, aumentam o faturamento sem precisar de mais leads — apenas convertendo melhor os que já chegam. Isso pode representar 20-40% de aumento de receita antes mesmo de escalar o tráfego.`;
    return `Com ${pct}% do potencial comercial ativado, esta é uma área que exige atenção imediata. Leads estão sendo perdidos antes do primeiro contato real, e pacientes que chegam à avaliação saem sem fechar por falta de processo estruturado. Estruturar o comercial é a ação de maior retorno imediato — nenhum investimento em tráfego terá ROI positivo sem um funil que converte.`;
  }
  if(k==="marketing") {
    if(pct>=75) return `A estratégia de marketing de ${nome} está madura, com ${pct}% do potencial ativado. Canais funcionando, presença digital consistente e infraestrutura de rastreamento em ordem. O próximo passo é otimização de ROI por canal, escalada de budget nos canais com melhor custo por aquisição e expansão para novos formatos de conteúdo.`;
    if(pct>=50) return `O marketing de ${nome} tem elementos funcionando, mas falta infraestrutura para medir resultado real e escalar com segurança. Com ${pct}% do potencial, há oportunidade significativa de crescimento apenas profissionalizando o que já existe: pixel instalado corretamente, landing page dedicada e budget alocado estrategicamente.`;
    return `Com ${pct}% do potencial de marketing ativado, esta é a área que mais limita o crescimento de ${nome}. Sem tráfego pago estruturado, landing page dedicada e pixel configurado, não é possível criar um fluxo previsível de novos pacientes. Dobrar o faturamento em 90 dias requer captação ativa e sistemática — esta área é prioridade máxima.`;
  }
  if(k==="operacional") {
    if(pct>=75) return `A operação de ${nome} está bem estruturada para absorver crescimento, com ${pct}% do potencial operacional ativado. Equipe, capacidade e processos suportam a escala planejada. O foco deve ser documentar e padronizar os processos existentes para garantir consistência conforme o volume aumenta.`;
    if(pct>=50) return `A estrutura operacional de ${nome} suporta o volume atual, mas pode criar gargalos conforme o marketing escala. Com ${pct}% do potencial, alguns processos precisam ser formalizados antes de apertar o acelerador — principalmente autorização de imagens e protocolo de orçamento.`;
    return `Com ${pct}% do potencial operacional ativado, há risco real de a clínica não conseguir absorver o crescimento gerado pelas ações de marketing. É preciso estruturar equipe, processos e capacidade antes de escalar a captação — gerar leads para uma operação que não consegue atender bem é perda de investimento.`;
  }
  if(k==="financeiro") {
    if(pct>=75) return `A saúde financeira de ${nome} é sólida, com ${pct}% do potencial ativado. Ticket médio, margens e tendência de crescimento criam base favorável para investimento em marketing com retorno previsível. O próximo passo é aumentar o reinvestimento em proporção ao crescimento.`;
    if(pct>=50) return `A situação financeira de ${nome} é funcional, mas com oportunidades claras de otimização. Com ${pct}% do potencial, gaps em conhecimento de margem, ticket médio e política de reinvestimento, quando endereçados, aumentam significativamente a eficiência e a velocidade de crescimento.`;
    return `Com ${pct}% do potencial financeiro ativado, é preciso urgentemente clareza sobre margens reais, ticket médio e política de reinvestimento. Crescer o faturamento sem clareza financeira pode aumentar o movimento sem aumentar o lucro — e pior, pode criar uma crise de caixa no pico de crescimento.`;
  }
  return "";
}

function buildPlano(a, prioridades, sg) {
  const nome = a.nome_clinica||"a clínica";
  const mes1 = {
    foco:"Fundação e Estrutura",
    objetivo:"Montar a base técnica e comercial para crescimento sustentável",
    cor:"#E91E63",
    acoes:[
      "Auditoria completa do funil atual: do lead ao fechamento, mapeando cada ponto de vazamento.",
      "Implementar CRM (Kommo ou similar) com funil e automações básicas de follow-up.",
      "Criar landing page de captação dedicada ao procedimento carro-chefe.",
      "Instalar e verificar Pixel do Meta + configurar eventos de conversão.",
      "Criar/otimizar Google Meu Negócio e iniciar captação sistemática de avaliações.",
      "Desenvolver script de atendimento padronizado para WhatsApp (qualificação + fechamento).",
      "Criar protocolo de autorização de imagem e banco fotográfico de casos.",
      sg.fatAtual>0 ? `Lançar campanha de reativação para base de pacientes dos últimos 18 meses.` : "Estruturar processo de orçamento padronizado com apresentação visual.",
    ]
  };
  const mes2 = {
    foco:"Aceleração e Otimização",
    objetivo:"Escalar o que funciona e eliminar desperdício de investimento",
    cor:"#FF9800",
    acoes:[
      "Escalar budget de tráfego pago com base no CPL apurado no mês 1 (meta: CPL <25% do ticket).",
      "Lançar campanhas de remarketing para leads que visitaram a landing page mas não converteram.",
      "Implementar Google Ads para termos de alta intenção na região da clínica.",
      "Otimizar taxa de conversão da landing page com base nos dados coletados (teste A/B de headline e CTA).",
      "Iniciar calendário editorial com 4 pilares de conteúdo e frequência mínima de 5 posts/semana.",
      "Treinar equipe em técnicas de fechamento e gestão das principais objeções.",
      sg.fatAtual>0 ? `Revisão de meta: checar se estamos no caminho para ${fmtR(sg.fatMeta)}/mês e ajustar budget conforme necessário.` : "Revisar processos operacionais e identificar gargalos de capacidade.",
    ]
  };
  const mes3 = {
    foco:"Consolidação e Meta SMART",
    objetivo:`Atingir ${fmtR(sg.fatMeta)}/mês e criar sistemas replicáveis`,
    cor:"#4CAF50",
    acoes:[
      sg.pacientesAdicionais>0 ? `Fechar ${sg.pacientesNecessarios} pacientes/mês com ticket médio de ${fmtR(sg.ticketMedio)} para atingir a meta de ${fmtR(sg.fatMeta)}.` : `Atingir e consolidar a meta de ${fmtR(sg.fatMeta)}/mês de faturamento.`,
      "Análise de ROI por canal: identificar os 2 canais com melhor custo de aquisição e concentrar investimento.",
      "Lançar programa de indicação estruturado: paciente indica e ganha benefício (ex: manutenção gratuita).",
      "Documentar todos os processos em playbook operacional para garantir consistência e escalabilidade.",
      "Avaliar expansão: aumento de capacidade, novo turno, novo procedimento ou segunda unidade.",
      "Revisão estratégica completa: o que funcionou, o que eliminar, plano para os próximos 90 dias.",
    ]
  };
  return {mes1,mes2,mes3};
}

function analyze(a) {
  const sc={comercial:0,marketing:0,operacional:0,financeiro:0};
  const max={comercial:10,marketing:10,operacional:10,financeiro:10};

  // COMERCIAL
  const tr=a.tempo_resp||"";
  if(tr.includes("Menos de 5")) sc.comercial+=3;
  else if(tr.includes("5 a 30")) sc.comercial+=2;
  else if(tr.includes("30 min")) sc.comercial+=1;
  const ca=a.conv_aval||"";
  if(ca.includes("Mais de 8")) sc.comercial+=2; else if(ca.includes("7 a 8")) sc.comercial+=1.5; else if(ca.includes("5 a 6")) sc.comercial+=1; else if(ca.includes("3 a 4")) sc.comercial+=0.5;
  const cp=a.conv_proc||"";
  if(cp.includes("Mais de 8")) sc.comercial+=2; else if(cp.includes("7 a 8")) sc.comercial+=1.5; else if(cp.includes("5 a 6")) sc.comercial+=1; else if(cp.includes("3 a 4")) sc.comercial+=0.5;
  const fu=a.follow_up||"";
  if(fu.includes("sempre")) sc.comercial+=1; else if(fu.includes("vezes")) sc.comercial+=0.5; else if(fu.includes("Raramente")) sc.comercial+=0.2;
  const crm=a.crm||"";
  if(crm.includes("CRM")) sc.comercial+=1; else if(crm.includes("Planilha")) sc.comercial+=0.7; else if(crm.includes("caderno")) sc.comercial+=0.3;
  const reat=a.reativacao||"";
  if(reat.includes("regularmente")) sc.comercial+=1; else if(reat.includes("vez em quando")) sc.comercial+=0.5;

  // MARKETING
  if(a.trafego&&!a.trafego.toLowerCase().includes("não")&&a.trafego.trim().length>2) sc.marketing+=2;
  const cont=a.conteudo||"",freq=a.freq_posts||"";
  if(!cont.includes("Ninguém")&&!cont.includes("parado")) {
    if(freq.includes("5 ou mais")) sc.marketing+=2; else if(freq.includes("3 a 4")) sc.marketing+=1.5; else if(freq.includes("1 a 2")) sc.marketing+=1; else sc.marketing+=0.3;
  }
  const lp=a.landing_page||"";
  if(lp.includes("landing page")) sc.marketing+=2; else if(lp.includes("WhatsApp")) sc.marketing+=1; else if(lp.includes("Instagram")) sc.marketing+=0.5;
  const pxl=a.pixel_meta||"";
  if(pxl.includes("ativo e configurado")) sc.marketing+=1; else if(pxl.includes("não sei se está")) sc.marketing+=0.5;
  if(a.instagram&&a.instagram.length>5) sc.marketing+=1;
  const gmn=a.gmn||"";
  if(gmn&&!gmn.toLowerCase().includes("não tenho")&&gmn.length>3) sc.marketing+=1;
  const econt=a.estrategia_conteudo||"";
  if(econt.includes("calendário")) sc.marketing+=1; else if(econt.includes("alguma lógica")) sc.marketing+=0.5;

  // OPERACIONAL
  const cap=parseInt(a.capacidade)||0;
  if(cap>=20) sc.operacional+=3; else if(cap>=15) sc.operacional+=2; else if(cap>=8) sc.operacional+=1;
  const dias=parseInt(a.dias_atendimento)||0;
  if(dias>=5) sc.operacional+=2; else if(dias>=3) sc.operacional+=1;
  if(a.equipe&&a.equipe.length>80) sc.operacional+=2; else if(a.equipe&&a.equipe.length>40) sc.operacional+=1;
  const aut=a.autorizacao_pacientes||"";
  if(aut.includes("termo")) sc.operacional+=2; else if(aut.includes("verbalmente")) sc.operacional+=1;
  const disp=a.disponibilidade_conteudo||"";
  if(disp.includes("sem problema")) sc.operacional+=1; else if(disp.includes("1 a 2")) sc.operacional+=0.5;

  // FINANCEIRO
  const fatA=pm(a.fat_atual);
  if(fatA>=80000) sc.financeiro+=3; else if(fatA>=50000) sc.financeiro+=2.5; else if(fatA>=30000) sc.financeiro+=2; else if(fatA>=15000) sc.financeiro+=1;
  const tick=pm(a.ticket);
  if(tick>=5000) sc.financeiro+=3; else if(tick>=3000) sc.financeiro+=2; else if(tick>=2000) sc.financeiro+=1.5; else if(tick>=1000) sc.financeiro+=1;
  if(a.margem&&!a.margem.toLowerCase().includes("não sei")) sc.financeiro+=1;
  const inv=a.investimento_mkt||"";
  if(inv.includes("Mais de 15")) sc.financeiro+=2; else if(inv.includes("7% e 15")) sc.financeiro+=1.5; else if(inv.includes("3% e 7")) sc.financeiro+=1; else if(inv.includes("Menos de 3")) sc.financeiro+=0.5;
  const tend=a.fat_tendencia||"";
  if(tend.includes("Crescendo")) sc.financeiro+=1; else if(tend.includes("Estável")) sc.financeiro+=0.5;

  Object.keys(sc).forEach(k=>{sc[k]=Math.min(Math.round(sc[k]*10)/10,max[k]);});

  // SMART GOAL
  const ticketMedio=tick>0?tick:2500;
  const fatMeta=Math.max(fatA*2,pm(a.meta));
  const pacientesAtuais=fatA>0&&ticketMedio>0?Math.round(fatA/ticketMedio):0;
  const pacientesNecessarios=ticketMedio>0?Math.ceil(fatMeta/ticketMedio):0;
  const smartGoal={fatAtual:fatA,fatMeta,ticketMedio,pacientesAtuais,pacientesNecessarios,pacientesAdicionais:Math.max(0,pacientesNecessarios-pacientesAtuais)};

  // AREAS
  const pcts={comercial:Math.round(sc.comercial/max.comercial*100),marketing:Math.round(sc.marketing/max.marketing*100),operacional:Math.round(sc.operacional/max.operacional*100),financeiro:Math.round(sc.financeiro/max.financeiro*100)};
  const comA=buildComercialAnalysis(a), mktA=buildMarketingAnalysis(a), opA=buildOperacionalAnalysis(a), finA=buildFinanceiroAnalysis(a);
  const areas={
    comercial:{...comA,score:sc.comercial,pct:pcts.comercial,nivel:nivelFn(pcts.comercial)},
    marketing:{...mktA,score:sc.marketing,pct:pcts.marketing,nivel:nivelFn(pcts.marketing)},
    operacional:{...opA,score:sc.operacional,pct:pcts.operacional,nivel:nivelFn(pcts.operacional)},
    financeiro:{...finA,score:sc.financeiro,pct:pcts.financeiro,nivel:nivelFn(pcts.financeiro)},
  };

  // PRIORITIES (lowest score first)
  const prioridades=Object.entries(areas).sort(([,x],[,y])=>x.pct-y.pct).map(([k])=>k);

  // PLAN
  const plano=buildPlano(a,prioridades,smartGoal);

  return{scores:sc,maxS:max,smartGoal,areas,prioridades,plano};
}

// ============ UI COMPONENTS ============
function Ring({v,max,color,size=60}){
  const pct=max===0?0:Math.round(v/max*100),r=size/2-6,c=2*Math.PI*r;
  return(<div style={{position:"relative",width:size,height:size}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EEE" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={c} strokeDashoffset={c-(c*pct/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s ease"}}/>
    </svg>
    <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size/4,fontWeight:700,color}}>{pct}%</span>
  </div>);
}

const fmtPhone=v=>{const d=(v||"").replace(/\D/g,"").slice(0,11);if(d.length<=2)return d.length?`(${d}`:"";if(d.length<=6)return `(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=10)return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;};
const fmtMoney=v=>{const d=(v||"").replace(/\D/g,"");if(!d)return "";const n=parseInt(d,10);return "R$ "+n.toLocaleString("pt-BR");};

function Input({q,value,onChange,err}){
  const base={width:"100%",boxSizing:"border-box",fontFamily:"inherit",fontSize:15,color:T,border:`1.5px solid ${err?R:BD}`,borderRadius:10,padding:"12px 16px",outline:"none",transition:"border-color 0.2s,box-shadow 0.2s",background:IB,lineHeight:1.6};
  const onFocusStyle=e=>{e.target.style.borderColor=O;e.target.style.boxShadow=`0 0 0 3px ${O}18`;};
  const onBlurStyle=e=>{e.target.style.borderColor=err?R:BD;e.target.style.boxShadow="none";};
  if(q.t==="sel")return(<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{q.o.map(opt=>{const s=value===opt;return(<button key={opt} onClick={()=>onChange(opt)} style={{padding:"8px 16px",borderRadius:20,fontSize:14,cursor:"pointer",fontWeight:s?600:400,border:`1.5px solid ${s?O:BD}`,background:s?OL:C,color:s?O:T2,transition:"all 0.2s"}}>{opt}</button>);})}</div>);
  if(q.t==="long"||q.t==="long_xl")return(<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={q.p||""} rows={q.t==="long_xl"?7:3} style={{...base,resize:"vertical"}} onFocus={onFocusStyle} onBlur={onBlurStyle}/>);
  if(q.id==="whatsapp")return(<input type="tel" value={fmtPhone(value)} onChange={e=>onChange(fmtPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={16} style={base} onFocus={onFocusStyle} onBlur={onBlurStyle}/>);
  if(q.p==="R$")return(<input type="text" inputMode="numeric" value={value?fmtMoney(value):""} onChange={e=>onChange(fmtMoney(e.target.value))} placeholder="R$ 0" style={base} onFocus={onFocusStyle} onBlur={onBlurStyle}/>);
  if(q.id==="maior_fat"){const prefixR=v=>{if(!v)return "";const s=v.startsWith("R$")||v.startsWith("r$")?v:"R$ "+v;return s;};return(<input type="text" value={value||""} onChange={e=>{const v=e.target.value;onChange(v&&!v.startsWith("R$")&&!v.startsWith("r$")?"R$ "+v:v);}} placeholder="Ex: R$ 112.000 em out/2025" style={base} onFocus={e=>{if(!value)onChange("R$ ");onFocusStyle(e);}} onBlur={e=>{if(value==="R$ ")onChange("");onBlurStyle(e);}}/>);}
  return(<input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder={q.p||""} style={base} onFocus={onFocusStyle} onBlur={onBlurStyle}/>);
}

const SEC_ICONS = {clinica:Building2,fat:BarChart3,serv:Gem,com:Target,mkt:Megaphone,visao:Rocket};

function Sec({s,ans,setAns,open,toggle,errs}){
  const ref=useRef(null);
  const cnt=s.qs.filter(q=>ans[q.id]&&String(ans[q.id]).trim()!=="").length,done=cnt===s.qs.length,he=s.qs.some(q=>errs.includes(q.id));
  const Icon=SEC_ICONS[s.id]||Building2;
  useEffect(()=>{if(open&&ref.current){setTimeout(()=>{ref.current.scrollIntoView({behavior:"smooth",block:"start"});},100);}},[open]);
  return(<div ref={ref} style={{background:C,borderRadius:16,overflow:"hidden",border:`1.5px solid ${he?"#FFCDD2":open?O+"44":BD}`,boxShadow:open?"0 4px 24px rgba(255,69,0,0.07)":"0 1px 3px rgba(0,0,0,0.05)",transition:"all 0.25s",scrollMarginTop:120,marginBottom:10}}>
    <div onClick={toggle} style={{padding:"18px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,userSelect:"none"}}>
      <div style={{width:40,height:40,borderRadius:11,background:open?OL:BG,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
        <Icon size={18} color={open?O:T2} strokeWidth={1.8}/>
      </div>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
          <span style={{fontSize:15,fontWeight:700,color:T}}>{s.title}</span>
          {done&&<span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:GL,color:G}}><CheckCircle2 size={10}/>Completo</span>}
          {!done&&cnt>0&&<span style={{fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:20,background:OL,color:O}}>{cnt}/{s.qs.length}</span>}
          {he&&<span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:RL,color:R}}><AlertCircle size={10}/>Obrigatório</span>}
        </div>
        <span style={{color:T3,fontSize:12}}>{s.sub}</span>
      </div>
      <div style={{color:T3,transition:"transform 0.25s",transform:open?"rotate(180deg)":"rotate(0)"}}>
        <ChevronDown size={18} strokeWidth={1.8}/>
      </div>
    </div>
    {open&&<div style={{padding:"4px 22px 26px",display:"flex",flexDirection:"column",gap:22,borderTop:`1px solid ${BD}`}}>
      {s.qs.map((q,i)=>{const he2=errs.includes(q.id);return(<div key={q.id} style={{paddingTop:i===0?18:0}}>
        <label style={{display:"block",marginBottom:9,color:T,fontSize:14,fontWeight:500,lineHeight:1.5}}>{q.l}{q.req&&<span style={{color:O,marginLeft:4}}>*</span>}</label>
        <Input q={q} value={ans[q.id]} err={he2} onChange={v=>setAns(p=>({...p,[q.id]:v}))}/>
        {he2&&<span style={{fontSize:12,color:R,marginTop:4,display:"block"}}>Campo obrigatório</span>}
      </div>);})}
    </div>}
  </div>);
}

// ============ DASHBOARD ============
function Dashboard({data,onBack}){
  const {scores,maxS,smartGoal,areas,prioridades,plano}=useMemo(()=>analyze(data),[data]);
  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  const maxT=Object.values(maxS).reduce((a,b)=>a+b,0);
  const saudeGeral=Math.round(total/maxT*100);
  const saudeCor=nivelFn(saudeGeral).color;
  const today=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});

  const CFG={
    comercial:{label:"Comercial",emoji:"🎯",color:"#E91E63"},
    marketing:{label:"Marketing",emoji:"📱",color:"#2196F3"},
    operacional:{label:"Operacional",emoji:"⚙️",color:"#FF9800"},
    financeiro:{label:"Financeiro",emoji:"📊",color:"#4CAF50"},
  };

  const acoesPrioritarias=prioridades.flatMap(k=>(areas[k].acoes||[]).filter(a=>a.tag==="URGENTE"||a.tag==="PRIORITÁRIA").slice(0,2)).slice(0,5);
  const crescimento=smartGoal.fatAtual>0?Math.round((smartGoal.fatMeta/smartGoal.fatAtual-1)*100):100;

  const tagColor=tag=>{
    if(tag==="URGENTE") return {bg:RL,c:R};
    if(tag==="PRIORITÁRIA") return {bg:YL,c:Y};
    if(tag==="ESTRATÉGICA"||tag==="ESTRUTURAL") return {bg:BL,c:B};
    return {bg:"#F3E5F5",c:"#9C27B0"};
  };

  return(<div style={{minHeight:"100vh",background:BG,fontFamily:"inherit"}}>
    <div style={{height:4,background:`linear-gradient(90deg,${O},#FF7043)`}}/>

    {/* NAV */}
    <div style={{position:"sticky",top:0,zIndex:10,background:C,borderBottom:`1px solid ${BD}`,padding:"0 24px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
      <div style={{maxWidth:880,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",height:56}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",color:T2,padding:"6px 10px",borderRadius:8,display:"flex",alignItems:"center",gap:6,fontFamily:"inherit",transition:"color 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.color=O} onMouseLeave={e=>e.currentTarget.style.color=T2}>
          <ArrowLeft size={15}/> Voltar
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontWeight:900,fontSize:16,letterSpacing:1}}><span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span></span>
          <span style={{color:T3,fontSize:10,fontWeight:700,letterSpacing:2}}>360</span>
        </div>
        <span style={{fontSize:12,color:T3}}>{today}</span>
      </div>
    </div>

    <div style={{maxWidth:880,margin:"0 auto",padding:"32px 24px 80px"}}>

      {/* HEADER */}
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:32,fontWeight:900,color:T,margin:"0 0 6px"}}>{data.nome_clinica||"Clínica"}</h1>
        <p style={{color:T2,fontSize:15,margin:0}}>{data.nome}{data.cidade_estado?` · ${data.cidade_estado}`:""}{data.whatsapp?` · ${data.whatsapp}`:""}</p>
      </div>

      {/* SMART GOAL */}
      <div style={{background:"linear-gradient(135deg,#1A1A2E,#16213E,#0F3460)",borderRadius:20,padding:32,marginBottom:20,color:"#fff"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2.5,color:OB,marginBottom:20}}>META SMART · 90 DIAS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto 1fr",gap:8,alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:6,letterSpacing:0.5}}>FATURAMENTO ATUAL</div>
            <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>{smartGoal.fatAtual>0?fmtR(smartGoal.fatAtual):"—"}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>por mês</div>
          </div>
          <div style={{fontSize:28,color:"rgba(255,255,255,0.2)",fontWeight:300,padding:"0 8px"}}>→</div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:12,color:OB,marginBottom:6,letterSpacing:0.5,fontWeight:700}}>META 90 DIAS</div>
            <div style={{fontSize:34,fontWeight:900,color:O}}>{smartGoal.fatMeta>0?fmtR(smartGoal.fatMeta):"—"}</div>
            <div style={{fontSize:12,color:OB}}>por mês</div>
          </div>
          <div style={{fontSize:28,color:"rgba(255,255,255,0.2)",fontWeight:300,padding:"0 8px"}}>=</div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:6,letterSpacing:0.5}}>CRESCIMENTO</div>
            <div style={{fontSize:34,fontWeight:900,color:G}}>+{crescimento}%</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>em 3 meses</div>
          </div>
        </div>
        {smartGoal.fatAtual>0&&<div style={{display:"flex",gap:0,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:20,flexWrap:"wrap",gap:24}}>
          <div><span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Pacientes/mês hoje: </span><span style={{color:"#fff",fontWeight:700,fontSize:15}}>{smartGoal.pacientesAtuais}</span></div>
          <div><span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Meta de pacientes: </span><span style={{color:"#fff",fontWeight:700,fontSize:15}}>{smartGoal.pacientesNecessarios}/mês</span></div>
          <div><span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Pacientes adicionais: </span><span style={{color:O,fontWeight:700,fontSize:15}}>+{smartGoal.pacientesAdicionais}/mês</span></div>
          <div><span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Ticket médio base: </span><span style={{color:"#fff",fontWeight:700,fontSize:15}}>{fmtR(smartGoal.ticketMedio)}</span></div>
        </div>}
      </div>

      {/* SAÚDE GERAL */}
      <div style={{background:C,borderRadius:20,padding:28,marginBottom:20,border:`1px solid ${BD}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:8}}>SAÚDE GERAL DO NEGÓCIO</div>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:42,fontWeight:900,color:saudeCor,lineHeight:1}}>{saudeGeral}%</span>
              <span style={{fontSize:14,fontWeight:700,color:nivelFn(saudeGeral).color,background:nivelFn(saudeGeral).bg,padding:"5px 14px",borderRadius:20}}>{nivelFn(saudeGeral).label}</span>
            </div>
          </div>
          <Ring v={total} max={maxT} color={saudeCor} size={96}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {Object.entries(CFG).map(([k,cfg])=>{
            const area=areas[k];
            return(<div key={k} style={{textAlign:"center",padding:"20px 8px",borderRadius:16,background:area.nivel.bg,border:`1px solid ${area.nivel.color}22`}}>
              <Ring v={scores[k]} max={maxS[k]} color={cfg.color} size={64}/>
              <div style={{marginTop:10,fontSize:13,fontWeight:700,color:T}}>{cfg.emoji} {cfg.label}</div>
              <div style={{fontSize:11,fontWeight:600,color:area.nivel.color,marginTop:4}}>{area.nivel.label}</div>
            </div>);
          })}
        </div>
      </div>

      {/* AÇÕES IMEDIATAS */}
      {acoesPrioritarias.length>0&&<div style={{background:`linear-gradient(135deg,${RL},${OL})`,borderRadius:20,padding:24,marginBottom:20,border:`1.5px solid ${OB}`}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:R,marginBottom:16}}>⚡ AÇÕES IMEDIATAS — PRÓXIMOS 14 DIAS</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {acoesPrioritarias.map((ac,i)=>{
            const tc=tagColor(ac.tag);
            return(<div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"rgba(255,255,255,0.75)",borderRadius:12,padding:"14px 16px"}}>
              <span style={{background:R,color:"#fff",borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{i+1}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:20,background:tc.bg,color:tc.c,letterSpacing:0.5}}>{ac.tag}</span>
                  <span style={{fontSize:11,color:T2}}>Prazo: {ac.prazo}</span>
                </div>
                <div style={{fontSize:13.5,color:T,lineHeight:1.6}}>{ac.texto}</div>
              </div>
              <div style={{flexShrink:0,textAlign:"right"}}>
                <div style={{fontSize:10,color:T3,marginBottom:2}}>Impacto</div>
                <div style={{fontSize:12,fontWeight:700,color:G}}>{ac.impacto}</div>
              </div>
            </div>);
          })}
        </div>
      </div>}

      {/* ANÁLISE POR ÁREA */}
      <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16,marginTop:4}}>ANÁLISE DETALHADA POR ÁREA · ORDENADA POR PRIORIDADE</div>

      {prioridades.map((k,idx)=>{
        const area=areas[k];
        const cfg=CFG[k];
        const diagText=buildDiagnostico(k,area.pct,data);
        const prioLabel=idx===0?"PRIORIDADE #1":idx===1?"PRIORIDADE #2":idx===2?"PRIORIDADE #3":null;
        const prioCor=idx===0?R:idx===1?Y:idx===2?B:T3;
        return(<div key={k} style={{background:C,borderRadius:20,padding:28,marginBottom:16,border:`1.5px solid ${area.pct<40?`${R}44`:area.pct<60?`${Y}44`:BD}`}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                {prioLabel&&<span style={{fontSize:10,fontWeight:800,background:prioCor,color:"#fff",padding:"3px 12px",borderRadius:20,letterSpacing:0.5}}>{prioLabel}</span>}
                <span style={{fontSize:20,fontWeight:800,color:T}}>{cfg.emoji} {cfg.label}</span>
                <span style={{fontSize:13,fontWeight:600,color:area.nivel.color,background:area.nivel.bg,padding:"4px 14px",borderRadius:20}}>{area.nivel.label} · {area.pct}%</span>
              </div>
            </div>
            <Ring v={scores[k]} max={maxS[k]} color={cfg.color} size={60}/>
          </div>
          {/* Score bar */}
          <div style={{height:6,background:"#EEE",borderRadius:10,overflow:"hidden",marginBottom:20}}>
            <div style={{height:"100%",width:`${area.pct}%`,background:`linear-gradient(90deg,${cfg.color}88,${cfg.color})`,borderRadius:10,transition:"width 1s ease"}}/>
          </div>
          {/* Diagnóstico */}
          <div style={{fontSize:14,color:T,lineHeight:1.85,marginBottom:22,padding:"16px 20px",background:BG,borderRadius:12,borderLeft:`4px solid ${cfg.color}`}}>
            {diagText}
          </div>
          {/* Fortes */}
          {area.fortes.length>0&&<div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:700,color:G,letterSpacing:1,marginBottom:10}}>✓ PONTOS FORTES</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {area.fortes.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 14px",background:GL,borderRadius:10}}>
                  <span style={{color:G,fontWeight:800,fontSize:14,flexShrink:0,marginTop:1}}>✓</span>
                  <span style={{fontSize:13.5,color:T,lineHeight:1.6}}>{f}</span>
                </div>
              ))}
            </div>
          </div>}
          {/* Fracos */}
          {area.fracos.length>0&&<div style={{marginBottom:22}}>
            <div style={{fontSize:11,fontWeight:700,color:R,letterSpacing:1,marginBottom:10}}>⚠ PONTOS DE ATENÇÃO</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {area.fracos.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 14px",background:RL,borderRadius:10}}>
                  <span style={{color:R,fontWeight:800,fontSize:14,flexShrink:0,marginTop:1}}>!</span>
                  <span style={{fontSize:13.5,color:T,lineHeight:1.6}}>{f}</span>
                </div>
              ))}
            </div>
          </div>}
          {/* Ações */}
          {area.acoes.length>0&&<div>
            <div style={{fontSize:11,fontWeight:700,color:B,letterSpacing:1,marginBottom:10}}>→ AÇÕES RECOMENDADAS</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {area.acoes.map((ac,i)=>{
                const tc=tagColor(ac.tag);
                return(<div key={i} style={{border:`1px solid ${BD}`,borderRadius:12,padding:"14px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:tc.bg,color:tc.c,letterSpacing:0.5}}>{ac.tag}</span>
                    <span style={{fontSize:11,color:T2}}>Prazo: {ac.prazo}</span>
                    <span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:G}}>Impacto: {ac.impacto}</span>
                  </div>
                  <div style={{fontSize:13.5,color:T,lineHeight:1.7}}>{ac.texto}</div>
                </div>);
              })}
            </div>
          </div>}
        </div>);
      })}

      {/* PLANO 90 DIAS */}
      <div style={{background:C,borderRadius:20,padding:28,marginBottom:20,border:`1px solid ${BD}`}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:24}}>PLANO DE AÇÃO · 90 DIAS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          {[{m:"Mês 1",d:plano.mes1},{m:"Mês 2",d:plano.mes2},{m:"Mês 3",d:plano.mes3}].map(({m,d})=>(
            <div key={m} style={{borderRadius:16,border:`1.5px solid ${d.cor}33`,padding:20,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-10,right:-10,fontSize:72,fontWeight:900,color:`${d.cor}08`,lineHeight:1,userSelect:"none"}}>{m.split(" ")[1]}</div>
              <div style={{fontSize:11,fontWeight:700,color:d.cor,marginBottom:4,letterSpacing:0.5}}>{m.toUpperCase()}</div>
              <div style={{fontSize:16,fontWeight:800,color:T,marginBottom:4}}>{d.foco}</div>
              <div style={{fontSize:12,color:T2,marginBottom:16,lineHeight:1.5}}>{d.objetivo}</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {d.acoes.map((ac,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{color:d.cor,fontWeight:800,fontSize:12,flexShrink:0,marginTop:2}}>›</span>
                    <span style={{fontSize:12.5,color:T,lineHeight:1.6}}>{ac}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RESPOSTAS COMPLETAS */}
      <div style={{background:C,borderRadius:20,padding:28,border:`1px solid ${BD}`}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:24}}>RESPOSTAS COMPLETAS DO MAPEAMENTO</div>
        {sections.map(s=>{
          const filled=s.qs.filter(q=>data[q.id]);
          if(!filled.length) return null;
          return(<div key={s.id} style={{marginBottom:24}}>
            <div style={{fontSize:14,fontWeight:700,color:O,marginBottom:12}}>{s.emoji} {s.title}</div>
            {filled.map(q=>(
              <div key={q.id} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid #F5F5F5"}}>
                <div style={{fontSize:11,color:T2,marginBottom:4}}>{q.l}</div>
                <div style={{fontSize:14,color:T,whiteSpace:"pre-wrap"}}>{data[q.id]}</div>
              </div>
            ))}
          </div>);
        })}
      </div>
    </div>
  </div>);
}

export default function App(){
  const [ans,setAns]=useState({});
  const [openId,setOpenId]=useState(sections[0].id);
  const [saving,setSaving]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [errs,setErrs]=useState([]);
  const [welcomed,setWelcomed]=useState(false);

  const answered=sections.reduce((a,s)=>a+s.qs.filter(q=>ans[q.id]&&String(ans[q.id]).trim()!=="").length,0);
  const pct=Math.round(answered/totalQ*100);

  const handleSubmit=async()=>{
    const miss=allQs.filter(q=>q.req).map(q=>q.id).filter(id=>!ans[id]||String(ans[id]).trim()==="");
    if(miss.length>0){setErrs(miss);for(const s of sections){if(s.qs.some(q=>miss.includes(q.id))){setOpenId(s.id);break;}}return;}
    setErrs([]);
    const entry={...ans,_ts:new Date().toISOString(),_id:Date.now().toString()};
    const {error}=await supabase.from("mapeamentos").insert([{id:entry._id,data:entry}]);
    if(error){alert("Erro ao enviar: "+error.message);return;}
    setSubmitted(true);
  };

  if(submitted) return(
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40,maxWidth:480}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:GL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:40}}>✓</div>
        <h1 style={{fontSize:28,fontWeight:800,color:T}}>Mapeamento enviado!</h1>
        <p style={{color:T2,marginBottom:24}}>Nossa equipe analisará seus dados em breve.</p>
        <button onClick={()=>window.location.reload()} style={{padding:"12px 24px",background:O,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Página Inicial</button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#F8F9FB",fontFamily:"inherit"}}>
      <div style={{height:3,background:`linear-gradient(90deg,${O},#FF7043,#FF9800)`}}/>

      {/* HEADER */}
      <div style={{background:C,borderBottom:`1px solid ${BD}`,padding:"0 24px",position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 12px rgba(0,0,0,0.04)"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <a href="/dashboard" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:2}}>
                <span style={{fontWeight:900,fontSize:22,letterSpacing:1}}><span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span></span>
              </a>
              <div style={{width:1,height:20,background:BD}}/>
              <span style={{color:T3,fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>360</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {saving&&<span style={{fontSize:11,color:T3,display:"flex",alignItems:"center",gap:4}}><Activity size={12} color={T3}/>Salvando</span>}
              <div style={{display:"flex",alignItems:"center",gap:8,background:pct===100?GL:OL,padding:"6px 12px",borderRadius:20}}>
                <span style={{fontSize:12,fontWeight:700,color:pct===100?G:O}}>{pct}%</span>
                <div style={{width:60,height:4,background:"rgba(0,0,0,0.08)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct===100?G:O,borderRadius:4,transition:"width 0.4s ease"}}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"20px 20px"}}>
          {!welcomed?(
            <div style={{marginTop:20}}>
              {/* Hero card */}
              <div style={{background:C,borderRadius:20,overflow:"hidden",border:`1px solid ${BD}`,boxShadow:"0 2px 20px rgba(0,0,0,0.05)"}}>
                <div style={{background:`linear-gradient(135deg,#1A1A2E,#0F3460)`,padding:"40px 40px 36px",textAlign:"center"}}>
                  <div style={{width:60,height:60,borderRadius:16,background:"rgba(255,69,0,0.2)",border:"1px solid rgba(255,69,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
                    <Target size={28} color={O}/>
                  </div>
                  <h1 style={{fontSize:28,fontWeight:900,color:"#fff",margin:"0 0 10px",letterSpacing:-0.5}}>AXIS 360</h1>
                  <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",margin:0,letterSpacing:1.5,fontWeight:600}}>MAPEAMENTO ESTRATÉGICO</p>
                </div>
                <div style={{padding:"32px 40px 36px"}}>
                  <p style={{fontSize:15,color:T2,lineHeight:1.9,margin:"0 0 28px",textAlign:"center"}}>
                    Este mapeamento é a base de todo o nosso trabalho. Com as suas respostas, nossa equipe constrói o plano de ação, define prioridades e conduz cada etapa com precisão.<br/><br/>
                    <strong style={{color:T}}>Separe 15–20 minutos</strong> e responda com calma. Quanto mais detalhado, mais certeiro o resultado.
                  </p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
                    {[{icon:Clock,label:"15–20 min",sub:"para preencher"},{icon:Shield,label:"100% seguro",sub:"dados protegidos"},{icon:TrendingUp,label:"Plano real",sub:"não genérico"}].map(it=>(
                      <div key={it.label} style={{textAlign:"center",padding:"16px 12px",borderRadius:12,background:"#F8F9FB",border:`1px solid ${BD}`}}>
                        <it.icon size={20} color={O} style={{marginBottom:8}}/>
                        <div style={{fontSize:13,fontWeight:700,color:T}}>{it.label}</div>
                        <div style={{fontSize:11,color:T3,marginTop:2}}>{it.sub}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setWelcomed(true)} style={{width:"100%",background:`linear-gradient(135deg,${O},#FF6030)`,color:"#fff",border:"none",borderRadius:13,padding:"16px",fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:0.3,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 20px ${O}44`}}>
                    Iniciar mapeamento <ChevronRight size={18}/>
                  </button>
                </div>
              </div>
            </div>
          ):(
            <>
              <div style={{marginBottom:8,paddingTop:4}}>
                {sections.map(s=><Sec key={s.id} s={s} ans={ans} setAns={setAns} open={openId===s.id} errs={errs} toggle={()=>setOpenId(openId===s.id?null:s.id)}/>)}
              </div>
              <button onClick={handleSubmit} style={{width:"100%",background:`linear-gradient(135deg,${O},#FF6030)`,color:"#fff",border:"none",borderRadius:13,padding:"16px",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 20px ${O}44`}}>
                Enviar mapeamento <ChevronRight size={18}/>
              </button>
            </>
          )}
        </div>
    </div>
  );
}
