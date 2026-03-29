# Projeto Barbearia

## Visão Geral

Esta V1 entrega um sistema de agendamento para barbearia com:

- frontend web em Vite + React
- backend HTTP em Node.js + TypeScript + Express
- persistência em MongoDB via Mongoose
- autenticação por JWT com cookies
- operação para três perfis: cliente, barbeiro e administrador

O objetivo do produto é permitir agendamento self-service pelo cliente e controle operacional, administrativo e financeiro pela barbearia.

## Perfis de Usuário

### Cliente

Pode:

- criar conta
- fazer login
- visualizar todos os próprios agendamentos
- abrir novo agendamento em fluxo guiado
- cancelar agendamento dentro da regra de antecedência

Não pode:

- ver agenda de outros clientes
- concluir atendimento
- marcar pagamento
- alterar disponibilidade

### Barbeiro

Pode:

- fazer login
- visualizar apenas a própria agenda
- visualizar agenda por data selecionada
- concluir atendimento
- marcar pagamento
- gerenciar a própria disponibilidade
- cancelar ou remarcar agendamentos vinculados a ele, conforme regra de antecedência

Não pode:

- acessar financeiro administrativo
- gerenciar clientes, admins ou serviços administrativos globais
- alterar disponibilidade de outro barbeiro

### Administrador

Pode:

- fazer login
- visualizar agenda com filtros operacionais
- criar agendamento em nome de cliente
- gerenciar serviços
- gerenciar clientes
- gerenciar barbeiros
- gerenciar administradores
- configurar regras da barbearia
- visualizar financeiro
- excluir agendamentos

## Módulos da V1

### Autenticação

- login por e-mail e senha
- cadastro público cria usuário cliente
- separação de acesso por escopos de permissão
- o backend é a fonte de verdade para autenticação e autorização

### Agenda

- agenda do cliente lista todos os agendamentos dele
- agenda do barbeiro lista apenas agendamentos do dia selecionado
- agenda do admin possui visão por dia e por mês
- filtros por status existem para todos os perfis
- busca textual existe para admin e barbeiro
- cancelados ficam no final da lista
- pagos também são empurrados para o final dos itens ativos

### Novo Agendamento

#### Fluxo do Cliente

O fluxo do cliente é:

1. escolher barbeiro
2. escolher mês e ano
3. escolher dia no calendário
4. escolher horário disponível
5. escolher serviço
6. confirmar agendamento

Regras:

- o calendário mensal mostra quantidade de vagas por dia
- dias sem vagas ficam marcados como indisponíveis
- a lista de horários vem da API
- o frontend não deduz disponibilidade localmente

#### Fluxo do Admin

O fluxo do admin é:

1. escolher cliente
2. escolher serviço
3. escolher barbeiro compatível com o serviço
4. escolher mês e ano
5. escolher dia
6. escolher horário
7. confirmar agendamento

Regras:

- cliente e barbeiro não vêm pré-selecionados
- ao trocar cliente, o fluxo dependente é resetado
- ao trocar serviço, a lista de barbeiros deve ser recalculada
- ao trocar barbeiro, calendário e horários devem ser recarregados

### Disponibilidade

- existe uma janela global de horários da barbearia
- disponibilidade diária e mensal é calculada pela API
- o barbeiro visualiza a disponibilidade em grade compacta
- há ação em lote para ativar todos os horários do dia
- há ação em lote para desativar todos os horários livres do dia
- horários reservados não podem ser desativados

### Administrativo

O administrativo foi separado por páginas internas:

- serviços
- clientes
- barbeiros
- admins
- regras da barbearia

### Financeiro

O financeiro do admin possui:

- filtro por período
- resumo bruto
- resumo da parte da barbearia
- resumo da parte dos barbeiros
- total de atendimentos
- total de pagos
- total de pendentes
- consolidado por barbeiro
- extrato detalhado

O conteúdo pesado foi dividido em navegação interna:

- consolidado
- extrato

## Regras de Negócio Consolidadas

### Agendamento

1. Todo agendamento pertence a exatamente um cliente.
2. Todo agendamento pertence a exatamente um barbeiro.
3. Todo agendamento pertence a exatamente um serviço.
4. Todo novo agendamento nasce com status `confirmed`.
5. Os status válidos são `confirmed`, `cancelled` e `completed`.
6. A duração padrão do atendimento é de 45 minutos.
7. O barbeiro não pode ter dois agendamentos ativos no mesmo horário.
8. Um horário só pode ser reservado se estiver habilitado e livre.
9. A disponibilidade efetiva de booking vem do backend.

### Cancelamento, Remarcação e Alteração

1. Cliente, barbeiro e admin operam sobre a mesma base de dados.
2. Cliente pode cancelar ou remarcar apenas os próprios agendamentos.
3. Barbeiro pode cancelar ou remarcar apenas os agendamentos vinculados a ele.
4. Admin pode cancelar ou remarcar qualquer agendamento.
5. Agendamento cancelado não pode ser concluído.
6. Agendamento concluído não pode ser cancelado depois.
7. Alteração feita por barbeiro ou admin gera badge `Alterado`.
8. Alteração apenas de serviço também gera badge `Alterado`.

### Regras Configuráveis da Barbearia

As regras abaixo podem ser configuradas pelo admin no sistema:

- quando o atendimento pode ser concluído:
  - `after_start`
  - `anytime`
- quantas horas antes o barbeiro pode cancelar ou remarcar
- quantas horas antes o cliente pode cancelar ou remarcar
- quantas horas antes o cliente pode agendar

Padrões atuais:

- conclusão: após iniciar o atendimento
- barbeiro cancela/remarca com 12 horas
- cliente cancela/remarca com 3 horas
- cliente agenda com 2 horas

Observação:

- a antecedência mínima para criar agendamento vale para cliente
- admin pode criar agendamento sem essa restrição operacional

### Conclusão e Pagamento

1. Apenas barbeiro e admin podem concluir atendimento.
2. Apenas barbeiro e admin podem marcar pagamento.
3. Pagamento só pode ser registrado em agendamento `completed`.
4. Pagamento não pode ser registrado em duplicidade.
5. Agendamento cancelado não pode ser pago.
6. O pagamento registra data e hora.

### Serviços

1. Serviços pertencem à barbearia.
2. O admin pode criar, editar, ativar, desativar e excluir serviços.
3. Serviço pode ser atribuído a todos os barbeiros ou a uma seleção específica.
4. Serviço desativado continua visível no histórico e em agendamentos antigos.
5. Serviço desativado não pode entrar em novos agendamentos.
6. Serviço não pode ser excluído se já possuir agendamentos vinculados.

### Clientes, Barbeiros e Admins

1. O admin pode cadastrar clientes, barbeiros e administradores.
2. O admin pode excluir clientes, barbeiros e administradores.
3. Cliente não pode ser excluído se possuir agendamentos.
4. Barbeiro não pode ser excluído se possuir agendamentos.
5. Admin não pode excluir a si próprio.
6. O último admin do sistema não pode ser excluído.

### Disponibilidade

1. O sistema opera no timezone de Brasília.
2. A disponibilidade padrão do barbeiro é gerada automaticamente no cadastro.
3. A geração padrão cobre os próximos 12 meses.
4. A geração padrão considera segunda a sexta.
5. Os slots são criados com passo de 45 minutos.
6. Se houver barbeiros sem disponibilidade persistida, o backend recompõe a disponibilidade no bootstrap.

## Financeiro

### Regra de Rateio

Cada serviço pago é dividido em:

- 30% para a barbearia
- 70% para o barbeiro

### O que entra no financeiro

- cancelados não entram
- previsto considera agendamentos válidos do período
- recebido considera apenas os pagos
- pendente considera atendimentos ainda não pagos

### Visões disponíveis

- bruto previsto e recebido
- barbearia previsto e recebido
- barbeiro previsto e recebido
- total de atendimentos, pagos e pendentes
- consolidado por barbeiro
- extrato por atendimento

### Filtro padrão

O financeiro abre por padrão com:

- primeiro dia do mês atual
- último dia do mês atual

## Interface e Experiência

### Agenda

- badges visuais para `Confirmado`, `Cancelado`, `Concluído`, `Pago` e `Alterado`
- `Cancelado` é vermelho
- `Confirmado` usa fundo branco com borda e texto verdes
- `Concluído` é verde sólido
- cancelados ficam recolhidos no final em visão `Todos`

### Cliente

- na agenda do cliente não existe busca textual
- o cliente usa apenas filtro por status
- a listagem do cliente exibe todo o histórico dele

### Barbeiro

- o botão `Concluir` pode ficar bloqueado conforme a regra configurada
- quando bloqueado, a interface mostra tooltip contextual
- a disponibilidade foi otimizada para reduzir scroll

### Admin

- a navegação principal do admin é por menu suspenso
- a `Home` do admin foi renomeada para `Agenda`
- a agenda do admin suporta visão por dia e por mês
- a visão mensal mostra resumo por dia e permite abrir o detalhe do dia

### Mobile

- a interface foi refinada para uso em celular
- menu de 3 pontos e botão de sair ficam ancorados corretamente
- filtros foram incorporados aos próprios componentes para evitar desperdício de espaço

## Segurança

### Autenticação e Sessão

- JWT é assinado no backend
- o backend valida assinatura, expiração e escopos
- há access token curto e refresh token
- cookies são usados para a sessão
- existe fallback de access token em memória e `sessionStorage` para estabilidade de navegação

### Armazenamento de Senha

- senhas novas são armazenadas com hash `scrypt`
- usuários legados são migrados no bootstrap se ainda estiverem em texto puro

### Cookies

Os cookies de autenticação possuem configuração dedicada:

- `SameSite` configurável
- `Secure` configurável
- `Path` configurável
- `Domain` opcional
- `Max-Age`
- `Expires`
- `Priority=High`

### CORS e CSRF

- CORS é restrito a origens permitidas
- há suporte ao host local da API com frontend na porta `5173`
- requests mutáveis exigem token CSRF

### Logout

Ao fazer logout, o sistema limpa:

- sessão local
- access token em memória
- access token em `sessionStorage`
- dados de navegação
- filtros e modais

## Persistência, Concorrência e Banco

1. MongoDB é o banco principal.
2. Escritas são serializadas para evitar perda de atualização.
3. O backend usa um agregado `AppData` para leitura e escrita da base lógica.
4. IDs novos são gerados com UUID.
5. O seed mínimo cria um admin padrão quando o banco está vazio.

### Seed mínimo

O seed mínimo atual garante:

- admin padrão `admin@barbearia.local`
- senha padrão `123456`
- regras padrão da barbearia

O seed está separado em:

- [apps/api/src/infra/seed.ts](/home/neuberger/Documentos/projetinho-barbearia/apps/api/src/infra/seed.ts)

## Infraestrutura e Ambiente

### Backend

- Node.js + TypeScript
- Express
- Mongoose

### Frontend

- Vite
- React

### Rede local

- a API deve escutar em `0.0.0.0`
- o frontend pode localizar a API pelo host atual da página
- o projeto suporta acesso via celular na rede local usando `HOST_IP`

### Variáveis de ambiente usadas

- `HOST`
- `PORT`
- `HOST_IP`
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV`
- `CORS_ORIGINS`
- `AUTH_COOKIE_SAMESITE`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_PATH`
- `VITE_API_URL`

## Qualidade e Testes

- regras críticas de booking possuem testes automatizados
- build do frontend deve permanecer estável
- decisões estruturais relevantes devem ser registradas

## Critério de Sucesso da V1

A V1 é considerada pronta quando:

- cliente consegue se cadastrar e autenticar
- cliente consegue criar agendamento
- cliente consegue visualizar todo o histórico próprio
- barbeiro consegue visualizar agenda, concluir atendimento e marcar pagamento
- barbeiro consegue gerir disponibilidade
- admin consegue criar agendamento em nome do cliente
- admin consegue gerir serviços, clientes, barbeiros, admins e regras
- admin consegue visualizar agenda por dia e por mês
- admin consegue visualizar financeiro com consolidado e extrato
- sistema impede conflitos de agenda
- sistema respeita permissões por perfil
