// i18n.js - Internationalization module for Saioro site
// Supports PT-BR and EN-US

const I18N = {
  currentLang: 'pt',
  translations: {
    pt: {
      // Header
      'nav.recursos': 'Recursos',
      'nav.comandos': 'Comandos',
      'nav.comecar': 'Como começar',
      'nav.duvidas': 'Dúvidas',
      'nav.equipe': 'Equipe',
      'btn.add': 'Adicione o Saioro',
      'btn.language': 'Idioma',
      
      // Hero
      'hero.badge': '63 comandos · 5 categorias',
      'hero.title': 'Um bot completo para <span>o seu servidor</span>',
      'hero.lead': 'O Saioro reúne moderação, proteção contra raids, AutoMod nativo, sorteios, enquetes e ferramentas de comunidade em um só bot, com tudo configurado por comandos de barra, sem painel externo e sem depender de outros projetos.',
      'btn.add.hero': 'Adicione o Saioro',
      'btn.server': 'Entrar no servidor',
      'hero.note': 'O convite pede apenas as permissões usadas pelo bot. Administrador não é necessário.',
      
      // Destaques
      'destaques.title': 'Principais recursos',
      'feature.antiraid.title': 'Anti-Raid',
      'feature.antiraid.desc': 'Proteção contra entradas em massa e contas novas, com lockdown automático.',
      'feature.automod.title': 'AutoMod Nativo',
      'feature.automod.desc': 'Regras oficiais do Discord contra spam, menções em massa e ofensas, sem ler mensagens.',
      'feature.painel.title': 'Painel Inicial',
      'feature.painel.desc': 'Um só painel com botões para regras, cargos, FAQ, denúncias e candidaturas.',
      'feature.perfil.title': 'Perfil Personalizável',
      'feature.perfil.desc': 'Bio, cor, imagem, campos, emblemas automáticos, seu cartão, do seu jeito.',
      
      // Números
      'nums.63': 'comandos',
      'nums.5': 'categorias',
      'nums.100': 'comandos de barra',
      'nums.sqlite': 'dados locais',
      
      // Seção Recursos
      'recursos.title': 'O que o Saioro faz',
      'recursos.desc': 'Recursos pensados para o dia a dia de um servidor: proteger, organizar e dar vida à comunidade. Cada item abaixo é um comando real, já disponível.',
      
      // Recursos cards
      'recurso.painel': 'Painel Inicial',
      'recurso.painel.desc': 'Um único painel com botões para regras, cargos, FAQ, denúncias e candidaturas. As respostas são privadas, então ninguém precisa sair do canal. <code>/painel publicar</code>',
      'recurso.staff': 'Central da Staff',
      'recurso.staff.desc': 'Liste denúncias e candidaturas com filtro por status, limite de itens e link direto para o painel original onde ficam as decisões. <code>/denuncias listar</code> <code>/candidaturas listar</code>',
      'recurso.antiraid': 'Anti-Raid',
      'recurso.antiraid.desc': 'Detecta entradas em massa e contas recém-criadas, avisa a staff e, se quiser, tranca os canais por tempo limitado e restaura tudo sozinho. <code>/antiraid</code>',
      'recurso.automod': 'AutoMod Nativo',
      'recurso.automod.desc': 'Três regras nativas do Discord contra spam, menções em massa e ofensas graves — sem ler o conteúdo das mensagens. Cargos da staff ficam isentos. <code>/automod</code>',
      'recurso.mod': 'Moderação Completa',
      'recurso.mod.desc': 'Ban, banimento temporário, softban, expulsão, castigo, advertências com histórico, limpeza de mensagens, modo lento, trancar canais e mensagem fixa. <code>/warn</code> <code>/tempban</code>',
      'recurso.comunidade': 'Comunidade',
      'recurso.comunidade.desc': 'Sorteios com requisitos e re-sorteio, enquetes por botões, sugestões com aprovação, eventos no calendário do Discord e lembretes pessoais. <code>/sorteio</code> <code>/enquete</code>',
      'recurso.perfil': 'Perfil Personalizável',
      'recurso.perfil.desc': 'Cartão de membro com título, bio, pronomes, cor, imagem e campos configuráveis, além de emblemas automáticos por participação. <code>/perfil</code>',
      'recurso.boasvindas': 'Boas-vindas e Cargos',
      'recurso.boasvindas.desc': 'Canais de boas-vindas, despedida e logs, mensagem no privado, cargo automático e painel de cargos que o membro escolhe clicando. <code>/config</code> <code>/cargos-painel</code>',
      
      // Comandos
      'comandos.title': 'Comandos',
      'comandos.desc': 'Todos os 63 comandos, agrupados por categoria. No Discord, use <code>/help</code> para abrir o menu interativo ou consultar os detalhes de um comando específico.',
      'cmd.search': 'Buscar comando...',
      'cmd.filter.all': 'Todos',
      'cmd.filter.util': 'Utilidade',
      'cmd.filter.mod': 'Moderação',
      'cmd.filter.fun': 'Diversão',
      'cmd.filter.social': 'Social',
      'cmd.filter.config': 'Configuração',
      'cmd.result': 'comandos',
      'cmd.none': 'Nenhum comando encontrado para essa busca.',
      
      // Como começar
      'comecar.title': 'Como começar',
      'comecar.desc': 'Três passos e o servidor já está configurado. Tudo é feito por comandos de barra.',
      'passo1.title': 'Convide o bot',
      'passo1.desc': 'Clique em <strong>Adicione o Saioro</strong> e autorize as permissões pedidas. O Saioro não precisa de Administrador: só de enviar mensagens, gerenciar canais e cargos quando você usar esses recursos.',
      'passo2.title': 'Configure o básico',
      'passo2.desc': 'Use <code>/config boas-vindas</code>, <code>/config logs</code> e <code>/config denuncias</code> para apontar os canais. O <code>/diagnostico</code> mostra o que ainda falta.',
      'passo3.title': 'Publique os painéis',
      'passo3.desc': 'Rode <code>/regras</code> uma vez, depois <code>/painel publicar</code>. O painel inicial passa a reunir regras, cargos, FAQ, denúncias e candidaturas em um só lugar.',
      
      // Dúvidas
      'duvidas.title': 'Dúvidas frequentes',
      'duvidas.desc': 'Informações objetivas sobre permissões, dados e funcionamento.',
      'faq.free.q': 'O Saioro é gratuito?',
      'faq.free.a': 'Sim. O bot é um projeto independente, sem plano pago, sem anúncios e sem cobrança por recurso. Ele é mantido pelo próprio desenvolvedor.',
      'faq.admin.q': 'Preciso dar Administrador ao bot?',
      'faq.admin.a': 'Não. O convite solicita apenas as permissões efetivamente usadas, entre elas enviar mensagens, incorporar links, gerenciar mensagens, canais, cargos e apelidos, expulsar, banir e aplicar castigos. Recursos como o lockdown do anti-raid exigem <strong>Gerenciar Canais</strong>, e os painéis de cargos exigem <strong>Gerenciar Cargos</strong>.',
      'faq.any.q': 'Funciona em qualquer servidor?',
      'faq.any.a': 'Sim. O bot é multi-servidor e cada servidor guarda a própria configuração — canais, cargos, regras, FAQ, denúncias e candidaturas não se misturam entre servidores.',
      'faq.data.q': 'Onde ficam os dados?',
      'faq.data.a': 'Em um banco SQLite local, na máquina onde o bot está hospedado. Não há envio de dados para serviços externos nem venda de informações. Denúncias anônimas não mostram o autor no painel, mas a autoria fica registrada internamente para coibir abusos.',
      'faq.features.q': 'O bot tem música, economia ou inteligência artificial?',
      'faq.features.a': 'Não. O foco é utilidade, moderação e comunidade. Música, economia e comandos de IA não fazem parte do projeto.',
      'faq.help.q': 'Como vejo os detalhes de um comando?',
      'faq.help.a': 'Use <code>/help</code> para abrir o menu por categoria ou <code>/help comando</code> para ver os subcomandos e opções de um comando específico. A lista completa também está nesta página.',
      'faq.remove.q': 'Como removo o bot do servidor?',
      'faq.remove.a': 'Expulse o Saioro pelo menu de membros ou pela página de integrações do Discord. As configurações continuam no banco local até serem apagadas pelo responsável pelo bot.',
      
      // Equipe
      'equipe.title': 'Equipe',
      'equipe.desc': 'O Saioro é desenvolvido e mantido por uma pequena equipe apaixonada por comunidades saudáveis no Discord.',
      'member.vult': 'Vult',
      'member.vult.role': 'Fundador & Desenvolvedor',
      'member.vult.bio': 'Criador do Saioro. Desenvolve bots para Discord desde 2020.',
      'link.github': 'GitHub',
      'link.discord': 'Discord',
      
      // Chamada final
      'cta.title': 'Pronto para começar?',
      'cta.desc': 'Adicione o Saioro ao seu servidor e configure tudo em minutos — sem painel externo, sem dependências.',
      'cta.btn.add': 'Adicione o Saioro',
      'cta.btn.support': 'Entrar no suporte',
      
      // Footer
      'footer.copyright': '© 2026 Saioro. Todos os direitos reservados.',
      
      // Label do botão de idioma
      'btn.lang.label': 'Trocar idioma',
      'lang.pt': 'PT',
      'lang.en': 'EN',
      
      // Etiqueta do hero
      'hero.badge': '63 comandos · 5 categorias',
      
      // Lead do hero
      'hero.lead': 'O Saioro reúne moderação, proteção contra raids, AutoMod nativo, sorteios, enquetes e ferramentas de comunidade em um só bot, com tudo configurado por comandos de barra, sem painel externo e sem depender de outros projetos.',
      
      // Botões do hero
      'btn.add.hero': 'Adicione o Saioro',
      'btn.server': 'Entrar no servidor',
      
      // Nota do hero
      'hero.note': 'O convite pede apenas as permissões usadas pelo bot. Administrador não é necessário.',
      
      // Destaques
      'destaques.title': 'Principais recursos',
      'destaques.sub': 'Recursos nativos, sem depender de outros bots.',
      
      // Feature cards
      'feature.antiraid.title': 'Anti-Raid',
      'feature.antiraid.desc': 'Proteção contra entradas em massa e contas novas, com lockdown automático.',
      'feature.automod.title': 'AutoMod Nativo',
      'feature.automod.desc': 'Regras oficiais do Discord contra spam, menções em massa e ofensas, sem ler mensagens.',
      'feature.painel.title': 'Painel Inicial',
      'feature.painel.desc': 'Um só painel com botões para regras, cargos, FAQ, denúncias e candidaturas.',
      'feature.perfil.title': 'Perfil Personalizável',
      'feature.perfil.desc': 'Bio, cor, imagem, campos, emblemas automáticos, seu cartão, do seu jeito.',
      
      // Números
      'nums.63': 'comandos',
      'nums.5': 'categorias',
      'nums.100': 'comandos de barra',
      'nums.sqlite': 'dados locais',
      
      // Seção Recursos
      'recursos.title': 'O que o Saioro faz',
      'recursos.desc': 'Recursos pensados para o dia a dia de um servidor: proteger, organizar e dar vida à comunidade. Cada item abaixo é um comando real, já disponível.',
      
      // Recursos cards
      'recurso.painel': 'Painel Inicial',
      'recurso.painel.desc': 'Um único painel com botões para regras, cargos, FAQ, denúncias e candidaturas. As respostas são privadas, então ninguém precisa sair do canal. <code>/painel publicar</code>',
      'recurso.staff': 'Central da Staff',
      'recurso.staff.desc': 'Liste denúncias e candidaturas com filtro por status, limite de itens e link direto para o painel original onde ficam as decisões. <code>/denuncias listar</code> <code>/candidaturas listar</code>',
      'recurso.antiraid': 'Anti-Raid',
      'recurso.antiraid.desc': 'Detecta entradas em massa e contas recém-criadas, avisa a staff e, se quiser, tranca os canais por tempo limitado e restaura tudo sozinho. <code>/antiraid</code>',
      'recurso.automod': 'AutoMod Nativo',
      'recurso.automod.desc': 'Três regras nativas do Discord contra spam, menções em massa e ofensas graves — sem ler o conteúdo das mensagens. Cargos da staff ficam isentos. <code>/automod</code>',
      'recurso.mod': 'Moderação Completa',
      'recurso.mod.desc': 'Ban, banimento temporário, softban, expulsão, castigo, advertências com histórico, limpeza de mensagens, modo lento, trancar canais e mensagem fixa. <code>/warn</code> <code>/tempban</code>',
      'recurso.comunidade': 'Comunidade',
      'recurso.comunidade.desc': 'Sorteios com requisitos e re-sorteio, enquetes por botões, sugestões com aprovação, eventos no calendário do Discord e lembretes pessoais. <code>/sorteio</code> <code>/enquete</code>',
      'recurso.perfil': 'Perfil Personalizável',
      'recurso.perfil.desc': 'Cartão de membro com título, bio, pronomes, cor, imagem e campos configuráveis, além de emblemas automáticos por participação. <code>/perfil</code>',
      'recurso.boasvindas': 'Boas-vindas e Cargos',
      'recurso.boasvindas.desc': 'Canais de boas-vindas, despedida e logs, mensagem no privado, cargo automático e painel de cargos que o membro escolhe clicando. <code>/config</code> <code>/cargos-painel</code>',
      
      // Comandos
      'comandos.title': 'Comandos',
      'comandos.desc': 'Todos os 63 comandos, agrupados por categoria. No Discord, use <code>/help</code> para abrir o menu interativo ou consultar os detalhes de um comando específico.',
      'cmd.search': 'Buscar comando...',
      'cmd.filter.all': 'Todos',
      'cmd.filter.util': 'Utilidade',
      'cmd.filter.mod': 'Moderação',
      'cmd.filter.fun': 'Diversão',
      'cmd.filter.social': 'Social',
      'cmd.filter.config': 'Configuração',
      'cmd.result': 'comandos',
      'cmd.none': 'Nenhum comando encontrado para essa busca.',
      
      // Como começar
      'comecar.title': 'Como começar',
      'comecar.desc': 'Três passos e o servidor já está configurado. Tudo é feito por comandos de barra.',
      'passo1.title': 'Convide o bot',
      'passo1.desc': 'Clique em <strong>Adicione o Saioro</strong> e autorize as permissões pedidas. O Saioro não precisa de Administrador: só de enviar mensagens, gerenciar canais e cargos quando você usar esses recursos.',
      'passo2.title': 'Configure o básico',
      'passo2.desc': 'Use <code>/config boas-vindas</code>, <code>/config logs</code> e <code>/config denuncias</code> para apontar os canais. O <code>/diagnostico</code> mostra o que ainda falta.',
      'passo3.title': 'Publique os painéis',
      'passo3.desc': 'Rode <code>/regras</code> uma vez, depois <code>/painel publicar</code>. O painel inicial passa a reunir regras, cargos, FAQ, denúncias e candidaturas em um só lugar.',
      
      // Dúvidas
      'duvidas.title': 'Dúvidas frequentes',
      'duvidas.desc': 'Informações objetivas sobre permissões, dados e funcionamento.',
      'faq.free.q': 'O Saioro é gratuito?',
      'faq.free.a': 'Sim. O bot é um projeto independente, sem plano pago, sem anúncios e sem cobrança por recurso. Ele é mantido pelo próprio desenvolvedor.',
      'faq.admin.q': 'Preciso dar Administrador ao bot?',
      'faq.admin.a': 'Não. O convite solicita apenas as permissões efetivamente usadas, entre elas enviar mensagens, incorporar links, gerenciar mensagens, canais, cargos e apelidos, expulsar, banir e aplicar castigos. Recursos como o lockdown do anti-raid exigem <strong>Gerenciar Canais</strong>, e os painéis de cargos exigem <strong>Gerenciar Cargos</strong>.',
      'faq.any.q': 'Funciona em qualquer servidor?',
      'faq.any.a': 'Sim. O bot é multi-servidor e cada servidor guarda a própria configuração — canais, cargos, regras, FAQ, denúncias e candidaturas não se misturam entre servidores.',
      'faq.data.q': 'Onde ficam os dados?',
      'faq.data.a': 'Em um banco SQLite local, na máquina onde o bot está hospedado. Não há envio de dados para serviços externos nem venda de informações. Denúncias anônimas não mostram o autor no painel, mas a autoria fica registrada internamente para coibir abusos.',
      'faq.features.q': 'O bot tem música, economia ou inteligência artificial?',
      'faq.features.a': 'Não. O foco é utilidade, moderação e comunidade. Música, economia e comandos de IA não fazem parte do projeto.',
      'faq.help.q': 'Como vejo os detalhes de um comando?',
      'faq.help.a': 'Use <code>/help</code> para abrir o menu por categoria ou <code>/help comando</code> para ver os subcomandos e opções de um comando específico. A lista completa também está nesta página.',
      'faq.remove.q': 'Como removo o bot do servidor?',
      'faq.remove.a': 'Expulse o Saioro pelo menu de membros ou pela página de integrações do Discord. As configurações continuam no banco local até serem apagadas pelo responsável pelo bot.',
      
      // Equipe
      'equipe.title': 'Equipe',
      'equipe.desc': 'O Saioro é desenvolvido e mantido por uma pequena equipe apaixonada por comunidades saudáveis no Discord.',
      'member.vult': 'Vult',
      'member.vult.role': 'Fundador & Desenvolvedor',
      'member.vult.bio': 'Criador do Saioro. Desenvolve bots para Discord desde 2020.',
      'link.github': 'GitHub',
      'link.discord': 'Discord',
      
      // Chamada final
      'cta.title': 'Pronto para começar?',
      'cta.desc': 'Adicione o Saioro ao seu servidor e configure tudo em minutos — sem painel externo, sem dependências.',
      'cta.btn.add': 'Adicione o Saioro',
      'cta.btn.support': 'Entrar no suporte',
      
      // Footer
      'footer.copyright': '© 2026 Saioro. Todos os direitos reservados.',
      
      // Label do botão de idioma
      'btn.lang.label': 'Trocar idioma',
      'lang.pt': 'PT',
      'lang.en': 'EN',
    },
    
    en: {
      // Header
      'nav.recursos': 'Features',
      'nav.comandos': 'Commands',
      'nav.comecar': 'Get Started',
      'nav.duvidas': 'FAQ',
      'nav.equipe': 'Team',
      'btn.add': 'Add Saioro',
      'btn.language': 'Language',
      
      // Hero
      'hero.badge': '63 commands · 5 categories',
      'hero.title': 'A complete bot for <span>your server</span>',
      'hero.lead': 'Saioro combines moderation, raid protection, native AutoMod, giveaways, polls, and community tools in one bot — all configured via slash commands, no external dashboard, no dependencies on other projects.',
      'btn.add.hero': 'Add Saioro',
      'btn.server': 'Join Server',
      'hero.note': 'The invite only requests the permissions the bot actually uses. Administrator is not required.',
      
      // Destaques
      'destaques.title': 'Key Features',
      'feature.antiraid.title': 'Anti-Raid',
      'feature.antiraid.desc': 'Protection against mass joins and new accounts, with automatic lockdown.',
      'feature.automod.title': 'Native AutoMod',
      'feature.automod.desc': 'Official Discord rules against spam, mass mentions, and severe offenses — without reading message content.',
      'feature.painel.title': 'Starter Panel',
      'feature.painel.desc': 'A single panel with buttons for rules, roles, FAQ, reports, and applications.',
      'feature.perfil.title': 'Customizable Profile',
      'feature.perfil.desc': 'Bio, color, image, fields, automatic badges — your card, your way.',
      
      // Números
      'nums.63': 'commands',
      'nums.5': 'categories',
      'nums.100': 'slash commands',
      'nums.sqlite': 'local data',
      
      // Seção Recursos
      'recursos.title': 'What Saioro does',
      'recursos.desc': 'Features designed for daily server life: protect, organize, and bring your community to life. Each item below is a real command, already available.',
      
      // Recursos cards
      'recurso.painel': 'Starter Panel',
      'recurso.painel.desc': 'A single panel with buttons for rules, roles, FAQ, reports, and applications. Responses are private, so no one needs to leave the channel. <code>/painel publicar</code>',
      'recurso.staff': 'Staff Central',
      'recurso.staff.desc': 'List reports and applications with status filters, item limits, and direct links to the original panels where decisions are made. <code>/denuncias listar</code> <code>/candidaturas listar</code>',
      'recurso.antiraid': 'Anti-Raid',
      'recurso.antiraid.desc': 'Detects mass joins and newly created accounts, alerts staff, and optionally locks down channels for a limited time then restores them automatically. <code>/antiraid</code>',
      'recurso.automod': 'Native AutoMod',
      'recurso.automod.desc': 'Three native Discord AutoMod rules against spam, mass mentions, and severe offenses — without reading message content. Staff roles are exempt. <code>/automod</code>',
      'recurso.mod': 'Complete Moderation',
      'recurso.mod.desc': 'Ban, tempban, softban, kick, timeout, warnings with history, message purge, slowmode, lock channels, and sticky messages. <code>/warn</code> <code>/tempban</code>',
      'recurso.comunidade': 'Community',
      'recurso.comunidade.desc': 'Giveaways with requirements and rerolls, button polls, suggestions with approval, Discord calendar events, and personal reminders. <code>/sorteio</code> <code>/enquete</code>',
      'recurso.perfil': 'Customizable Profile',
      'recurso.perfil.desc': 'Member card with title, bio, pronouns, color, image, and configurable fields, plus automatic badges for participation. <code>/perfil</code>',
      'recurso.boasvindas': 'Welcome & Roles',
      'recurso.boasvindas.desc': 'Welcome, goodbye, and log channels, DM welcome message, automatic role, and role panel where members pick roles by clicking. <code>/config</code> <code>/cargos-painel</code>',
      
      // Comandos
      'comandos.title': 'Commands',
      'comandos.desc': 'All 63 commands, grouped by category. On Discord, use <code>/help</code> to open the interactive menu or view details for a specific command.',
      'cmd.search': 'Search command...',
      'cmd.filter.all': 'All',
      'cmd.filter.util': 'Utility',
      'cmd.filter.mod': 'Moderation',
      'cmd.filter.fun': 'Fun',
      'cmd.filter.social': 'Social',
      'cmd.filter.config': 'Config',
      'cmd.result': 'commands',
      'cmd.none': 'No commands found for that search.',
      
      // Como começar
      'comecar.title': 'Getting Started',
      'comecar.desc': 'Three steps and your server is configured. Everything is done via slash commands.',
      'passo1.title': 'Invite the bot',
      'passo1.desc': 'Click <strong>Add Saioro</strong> and authorize the requested permissions. Saioro doesn\'t need Administrator: only sending messages, managing channels and roles when you use those features.',
      'passo2.title': 'Configure the basics',
      'passo2.desc': 'Use <code>/config welcome</code>, <code>/config logs</code> and <code>/config denuncias</code> to set channels. The <code>/diagnostico</code> shows what\'s still missing.',
      'passo3.title': 'Publish panels',
      'passo3.desc': 'Run <code>/regras</code> once, then <code>/painel publicar</code>. The starter panel now gathers rules, roles, FAQ, reports, and applications in one place.',
      
      // Dúvidas
      'duvidas.title': 'Frequently Asked Questions',
      'duvidas.desc': 'Objective information about permissions, data, and operation.',
      'faq.free.q': 'Is Saioro free?',
      'faq.free.a': 'Yes. The bot is an independent project, no paid plans, no ads, no charge per feature. It is maintained by the developer.',
      'faq.admin.q': 'Do I need to give Administrator to the bot?',
      'faq.admin.a': 'No. The invite requests only the permissions actually used, including sending messages, embedding links, managing messages, channels, roles and nicknames, kicking, banning, and applying timeouts. Features like anti-raid lockdown require <strong>Manage Channels</strong>, and role panels require <strong>Manage Roles</strong>.',
      'faq.any.q': 'Does it work on any server?',
      'faq.any.a': 'Yes. The bot is multi-server and each server keeps its own configuration — channels, roles, rules, FAQ, reports, and applications don\'t mix between servers.',
      'faq.data.q': 'Where is the data stored?',
      'faq.data.a': 'In a local SQLite database on the machine hosting the bot. No data is sent to external services and no information is sold. Anonymous reports don\'t show the author in the panel, but authorship is recorded internally to prevent abuse.',
      'faq.features.q': 'Does the bot have music, economy, or AI?',
      'faq.features.a': 'No. The focus is utility, moderation, and community. Music, economy, and AI commands are not part of the project.',
      'faq.help.q': 'How do I see details for a command?',
      'faq.help.a': 'Use <code>/help</code> to open the category menu or <code>/help command</code> to see subcommands and options for a specific command. The full list is also on this page.',
      'faq.remove.q': 'How do I remove the bot from the server?',
      'faq.remove.a': 'Kick Saioro from the member menu or the Discord integrations page. Configurations remain in the local database until deleted by the bot owner.',
      
      // Equipe
      'equipe.title': 'Team',
      'equipe.desc': 'Saioro is developed and maintained by a small team passionate about healthy Discord communities.',
      'member.vult': 'Vult',
      'member.vult.role': 'Founder & Developer',
      'member.vult.bio': 'Creator of Saioro. Developing Discord bots since 2020.',
      'link.github': 'GitHub',
      'link.discord': 'Discord',
      
      // Chamada final
      'cta.title': 'Ready to get started?',
      'cta.desc': 'Add Saioro to your server and configure everything in minutes — no external dashboard, no dependencies.',
      'cta.btn.add': 'Add Saioro',
      'cta.btn.support': 'Join Support',
      
      // Footer
      'footer.copyright': '© 2026 Saioro. All rights reserved.',
      
      // Label do botão de idioma
      'btn.lang.label': 'Switch language',
      'lang.pt': 'PT',
      'lang.en': 'EN',
    }
  },
  
  init() {
    // Load saved language or default to Portuguese
    const saved = localStorage.getItem('saioro_lang');
    if (saved && this.translations[saved]) {
      this.currentLang = saved;
    }
    this.applyTranslations();
    this.setupLanguageSwitcher();
  },
  
  setupLanguageSwitcher() {
    const btn = document.getElementById('btn-idioma');
    
    if (!btn) return;
    
    btn.addEventListener('click', () => {
      this.toggleLanguage();
    });
  },
  
  toggleLanguage() {
    this.currentLang = this.currentLang === 'pt' ? 'en' : 'pt';
    localStorage.setItem('saioro_lang', this.currentLang);
    this.applyTranslations();
  },
  
  applyTranslations() {
    const lang = this.currentLang;
    const t = this.translations[lang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        // Use innerHTML for keys that contain HTML (like <strong>, <code>, <span>)
        if (el.innerHTML !== t[key]) {
          el.innerHTML = t[key];
        }
      }
    });
    
    // Update language button aria-label
    const langBtn = document.getElementById('btn-idioma');
    if (langBtn) {
      langBtn.setAttribute('aria-label', this.currentLang === 'pt' ? 'Switch to English' : 'Mudar para Português');
      langBtn.setAttribute('title', this.currentLang === 'pt' ? 'Switch to English' : 'Mudar para Português');
    }
    
    // Update document lang attribute
    document.documentElement.lang = this.currentLang === 'pt' ? 'pt-BR' : 'en-US';
    
    // Update page title
    document.title = this.currentLang === 'pt' 
      ? 'Saioro — bot de Discord para utilidade, moderação e comunidade'
      : 'Saioro — Discord bot for utility, moderation and community';
  },
  
  t(key) {
    return this.translations[this.currentLang][key] || key;
  }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18N.init());
  } else {
    I18N.init();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18N;
}