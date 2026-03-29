# Projeto Barbearia

## Visao Geral

Este projeto tem como objetivo criar uma aplicacao para gerenciamento de agendamentos de uma barbearia, com duas interfaces principais:

- Aplicativo do cliente
- Dashboard administrativo da barbearia

O sistema deve permitir que clientes realizem agendamentos com praticidade e que a barbearia tenha controle operacional, comercial e financeiro sobre os atendimentos.

## Objetivo do Produto

O produto deve resolver os seguintes problemas:

- Permitir que clientes agendem horarios sem depender de atendimento manual
- Evitar conflitos de agenda entre barbeiros
- Dar visibilidade da rotina diaria da barbearia
- Facilitar a gestao de clientes e profissionais
- Gerar previsao de receita com base nos agendamentos

## Perfis de Usuario

### Cliente

Pode:

- Criar conta e autenticar no sistema
- Visualizar barbeiros disponiveis
- Visualizar dias e horarios disponiveis
- Realizar agendamento
- Consultar seus proprios agendamentos
- Cancelar ou remarcar agendamentos, conforme as regras de negocio

### Barbeiro

Pode:

- Visualizar sua agenda
- Consultar atendimentos do dia
- Consultar historico de atendimentos vinculados a ele

### Administrador da Barbearia

Pode:

- Realizar login no dashboard
- Cadastrar, editar, ativar e desativar barbeiros
- Cadastrar, editar e consultar clientes
- Criar agendamentos em nome de clientes
- Consultar agenda por dia
- Filtrar agendamentos por cliente
- Filtrar agendamentos por barbeiro
- Visualizar relatorio financeiro com previsao de receita

## Escopo Funcional

### Modulo de Autenticacao

O sistema deve possuir autenticacao por usuario e senha.

O frontend deve possuir uma unica tela de login para todos os usuarios.

Deve existir separacao de permissao entre:

- Cliente
- Barbeiro
- Administrador

Cada usuario deve possuir exatamente um perfil.

Após o login, o sistema deve liberar apenas os modulos permitidos para o perfil autenticado.

### Modulo de Agendamento

O cliente e o administrador poderao:

- Escolher o servico
- Escolher o barbeiro
- Escolher a data
- Escolher o horario
- Confirmar o agendamento

O sistema deve garantir:

- Que um barbeiro nao tenha dois agendamentos no mesmo horario
- Que apenas horarios disponiveis sejam exibidos
- Que agendamentos respeitem status e regras de disponibilidade

### Modulo de Gestao

O dashboard administrativo deve permitir:

- Cadastro de barbeiros
- Cadastro de clientes
- Consulta de agenda diaria
- Consulta de agendamentos com filtros
- Consulta de atendimentos por barbeiro

### Modulo Financeiro

O administrador deve conseguir visualizar:

- Periodo filtrado
- Quantidade de agendamentos no periodo
- Previsao de receita do periodo

Regra inicial:

- A previsao de receita deve ser calculada com base nos agendamentos do periodo filtrado, excluindo cancelados
- O relatorio de pagamentos realizados deve considerar apenas atendimentos com recebimento confirmado

## Entidades Principais

O dominio inicial do sistema deve considerar ao menos as seguintes entidades:

- Usuario
- Cliente
- Barbeiro
- Agendamento
- Disponibilidade
- Servico
- Pagamento

## Regras de Negocio

As regras abaixo devem ser consideradas como base inicial do projeto:

1. Todo agendamento deve estar vinculado a um cliente e a um barbeiro.
2. Todo agendamento deve estar vinculado a um unico servico.
3. Um barbeiro nao pode possuir dois agendamentos no mesmo horario.
4. Um horario so pode ser reservado se estiver disponivel.
5. O cliente so pode visualizar e gerenciar os proprios agendamentos.
6. O administrador pode visualizar e gerenciar todos os agendamentos.
7. O sistema deve permitir filtros por cliente, barbeiro e periodo.
8. O sistema deve suportar, no minimo, os status de agendamento:

- Confirmado
- Cancelado
- Concluido
9. Novos agendamentos devem ser criados ja com status Confirmado.
10. A duracao padrao de cada atendimento sera de 45 minutos.
11. O cliente nao pode selecionar mais de um servico no mesmo agendamento.
12. Os servicos pertencem a barbearia e sao cadastrados pelo administrador.
13. O valor do servico sera definido pelo administrador e sera o mesmo para todos os barbeiros aptos a executa-lo.
14. O administrador define quais servicos cada barbeiro pode executar.
15. A antecedencia minima para criar um agendamento sera de 2 horas.
16. O cliente pode cancelar ou remarcar um agendamento com no minimo 3 horas de antecedencia.
17. O barbeiro pode cancelar ou remarcar um agendamento com no minimo 12 horas de antecedencia.
18. O administrador pode cancelar ou remarcar um agendamento a qualquer momento.
19. A barbearia possui horario global de funcionamento das 08:00 as 20:00, no fuso horario de Brasilia.
20. O administrador cria os horarios base de disponibilidade.
21. O barbeiro pode ativar ou desativar horarios a qualquer momento, desde que o horario esteja livre.
22. Um horario com agendamento existente nao pode ser desativado pelo barbeiro.
23. Deve existir bloqueio manual de horarios por disponibilidade.
24. A previsao financeira deve considerar os agendamentos do periodo, pela data do agendamento, excluindo os cancelados.
25. O relatorio de pagamentos finalizados deve considerar apenas agendamentos com recebimento igual a verdadeiro.
26. O pagamento so pode ser marcado ao final do atendimento.
27. O pagamento pode ser marcado pelo barbeiro ou pelo administrador.
28. O registro de pagamento deve armazenar data e hora da confirmacao do recebimento.
29. Agendamentos cancelados nao podem ser marcados como pagos.
30. Cliente, Barbeiro e Administrador sao entidades separadas, ligadas a uma superclasse Usuario para compartilhamento de informacoes basicas.
31. Cada Usuario deve possuir exatamente um perfil no sistema.
32. Quando um barbeiro ou administrador alterar dia ou horario de um agendamento, o cliente deve visualizar um badge de alteracao no proprio agendamento.
33. O fluxo de agendamento do cliente deve iniciar pela escolha de um barbeiro disponivel.
34. Os servicos nao devem ser apagados fisicamente; devem apenas ser desativados.
35. Servicos desativados continuam visiveis em agendamentos antigos, mas nao podem ser usados em novos agendamentos.
36. Ao cadastrar um barbeiro, o backend deve gerar automaticamente a disponibilidade padrao para os proximos 12 meses, de segunda a sexta, das 08:00 as 18:00, com intervalos de 45 minutos.

## Decisoes Consolidadas

### Agendamento

- Todo novo agendamento nasce com status `Confirmado`
- Os status validos serao `Confirmado`, `Cancelado` e `Concluido`
- Cada agendamento possui exatamente um cliente, um barbeiro e um servico
- A duracao padrao do atendimento sera de 45 minutos
- O cliente deve agendar com antecedencia minima de 2 horas

### Cancelamento e Remarcacao

- O cliente pode cancelar ou remarcar com antecedencia minima de 3 horas
- O barbeiro pode cancelar ou remarcar com antecedencia minima de 12 horas
- O administrador pode cancelar ou remarcar a qualquer momento
- Alteracoes de data e horario feitas por barbeiro ou administrador devem ser sinalizadas ao cliente com badge

### Servicos

- O administrador pode criar quantos servicos desejar
- O servico pertence a barbearia
- O valor do servico e definido pelo administrador
- O valor do servico e igual para todos os barbeiros
- O administrador define quais barbeiros estao aptos para cada servico
- O cliente nao pode contratar mais de um servico no mesmo agendamento
- Servicos podem ser desativados em vez de apagados
- Servicos desativados nao aparecem para novos agendamentos
- Servicos desativados continuam visiveis no historico e em agendamentos antigos

### Disponibilidade

- A barbearia possui horario global de funcionamento das 08:00 as 20:00
- O timezone oficial do sistema sera Brasilia
- O administrador cria os horarios base disponiveis
- O cadastro de barbeiro deve gerar disponibilidade padrao automaticamente no backend para os proximos 12 meses
- O barbeiro pode ativar ou desativar horarios de forma simples
- O barbeiro so pode desativar horarios que estejam livres
- Horarios com agendamento nao podem ser desativados
- A API deve ser a unica fonte de verdade para informar se um horario esta disponivel para novo agendamento
- O frontend nao deve deduzir disponibilidade localmente quando houver retorno explicito do backend
- O fluxo de agendamento do cliente deve consultar disponibilidade diaria e mensal diretamente da API
- A disponibilidade mensal deve informar, por dia, a quantidade de vagas disponiveis
- Dias sem vagas devem ser tratados como indisponiveis no calendario do cliente
- Quando a base estiver inconsistente e um barbeiro existir sem disponibilidade gerada, o backend deve reconstruir a disponibilidade padrao no bootstrap

### Pagamentos e Financeiro

- O pagamento acontece apenas ao final do atendimento
- O pagamento pode ser registrado pelo barbeiro ou pelo administrador
- O recebimento deve registrar data e hora da confirmacao
- Cancelamentos nao entram na previsao de receita
- A previsao financeira usa a data do agendamento como referencia
- O relatorio de pagamentos finalizados considera apenas recebimentos confirmados

### Agenda e Visualizacao

- O cliente deve visualizar todos os seus agendamentos, independentemente da data
- O barbeiro deve visualizar apenas os agendamentos do dia selecionado
- O administrador deve visualizar a agenda diaria do dia selecionado
- Agendamentos cancelados devem ser exibidos no final da lista
- A agenda deve possuir filtro por status para todos os perfis
- A agenda administrativa deve possuir tambem busca textual e filtros por barbeiro e servico

### Estados do Agendamento

- Os estados validos de agenda em uso no produto sao `confirmed`, `cancelled` e `completed`
- Todo novo agendamento nasce confirmado
- Um agendamento cancelado nao pode voltar a ser concluido
- Um agendamento concluido nao pode ser cancelado depois
- Um agendamento cancelado nao pode ser pago
- Um agendamento nao pode receber pagamento em duplicidade
- Alteracoes feitas por barbeiro ou administrador devem marcar o agendamento como alterado para o cliente

### Persistencia e Concorrencia

- Operacoes de escrita sobre os dados agregados devem ser serializadas para evitar perda de atualizacao
- Fluxos como criar, cancelar, reagendar, concluir e registrar pagamento nao podem sobrescrever alteracoes simultaneas

### Infraestrutura e Rede

- A API deve escutar em `0.0.0.0` para funcionar fora do `localhost`
- O frontend deve usar o host atual da pagina como fallback para localizar a API em ambiente local
- Para acesso por celular na rede local, deve ser possivel definir `HOST_IP` e `VITE_API_URL`

## Historico Consolidado Do Que Ja Foi Feito

### Backend

- A camada HTTP foi migrada para Express para gerenciamento de rotas
- Foram introduzidos controllers para orquestrar requisicoes e separar transporte de regra de negocio
- O roteamento HTTP foi centralizado em arquivo proprio
- O boot da API foi simplificado para criar a aplicacao e iniciar o servidor separadamente
- O backend passou a validar melhor transicoes invalidas de status do agendamento
- O backend passou a serializar escritas para evitar inconsistencias em operacoes concorrentes
- A API ganhou endpoints especificos para disponibilidade de agendamento do cliente por dia e por mes
- O backend passou a reconstruir disponibilidade padrao quando detectar barbeiros cadastrados sem slots persistidos

### Frontend

- O frontend passou a usar a API como fonte de verdade para horarios disponiveis
- O fluxo de agendamento do cliente foi remodelado para funcionar em etapas: barbeiro, calendario, horarios, servico e confirmacao
- O calendario de agendamento do cliente passou a mostrar o mes atual com indicacao de vagas e dias sem vagas
- O calendario passou a permitir escolha explicita de mes e ano
- O cliente passou a visualizar todos os seus agendamentos
- O barbeiro e o administrador continuam focados na agenda do dia
- A agenda ganhou badges visuais mais claros para confirmado, concluido, cancelado, pago e alterado
- A agenda ganhou filtros integrados ao proprio componente da listagem
- O fluxo de cancelamento do cliente passou a usar confirmacao em modal com aviso de antecedencia minima de 3 horas
- O layout mobile foi refinado, incluindo posicionamento do menu de 3 pontos, do botao sair e do botao flutuante de novo agendamento

## Requisitos Nao Funcionais

- O projeto deve ser containerizado com Docker
- O banco de dados principal sera MongoDB
- O backend sera desenvolvido com Node.js e TypeScript
- O frontend sera desenvolvido com Vite React
- O sistema deve operar no timezone de Brasilia
- O sistema deve ser organizado para facilitar manutencao e evolucao
- O codigo deve ser escrito com foco em legibilidade, testes e separacao de responsabilidades

## Diretrizes Tecnicas

### Backend

- Utilizar TypeScript
- Organizar camadas de forma clara
- Separar dominio, regras de negocio e acesso a dados
- Evitar logica de negocio espalhada em controllers

### Frontend

- Organizar a aplicacao por modulos ou features
- Separar componentes visuais de regras de negocio sempre que possivel
- Tratar estados de carregamento, erro e sucesso
- Garantir boa experiencia de uso em desktop e mobile

### Banco de Dados

- Modelar colecoes com foco nas regras do dominio
- Garantir consistencia minima para evitar conflitos de agenda
- Prever campos de auditoria como data de criacao e atualizacao

## Padrao de Qualidade

### Testes

As seguintes diretrizes devem ser seguidas:

- Sempre escrever testes antes da implementacao da funcionalidade quando viavel
- Priorizar testes unitarios para regras de negocio
- Criar testes de integracao para fluxos criticos, principalmente agendamento, disponibilidade e relatorio financeiro
- Testes existentes nao devem ser alterados sem justificativa clara ou autorizacao explicita

### Padrao de Projeto

- O projeto deve manter consistencia de nomenclatura, estrutura e estilo de codigo
- Novas funcionalidades devem seguir o padrao arquitetural adotado no repositorio
- Toda decisao estrutural relevante deve ser documentada

## Roadmap Inicial Sugerido

### Fase 1

- Estruturar backend e frontend
- Configurar ambiente com Docker
- Configurar autenticacao
- Criar entidades principais

### Fase 2

- Implementar cadastro de barbeiros e clientes
- Implementar disponibilidade
- Implementar criacao e consulta de agendamentos

### Fase 3

- Implementar filtros administrativos
- Implementar remarcacao e cancelamento
- Implementar relatorio financeiro

## Criterio de Sucesso da Primeira Versao

A primeira versao do sistema sera considerada funcional quando:

- O cliente conseguir criar conta e autenticar
- O cliente conseguir agendar horario com um barbeiro
- O administrador conseguir visualizar a agenda do dia
- O administrador conseguir filtrar agendamentos por cliente e barbeiro
- O sistema impedir conflitos de horario
- O administrador conseguir visualizar a previsao de receita por periodo
- Barbeiro conseguir acessar o aplicativo para bloquear horarios, concluir agendamentos e marcar agendamentos como pago
