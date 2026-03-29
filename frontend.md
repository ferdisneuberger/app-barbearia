## Direcao Geral

- O frontend deve ser separado por perfil e por funcionalidade, evitando concentrar tudo em uma unica tela.
- O sistema deve possuir uma unica tela de login, mas a experiencia apos autenticacao deve mudar de acordo com o perfil.
- O frontend deve priorizar clareza visual, fluxo simples de agendamento e navegacao modular.

## Login Cliente

- A tela inicial do cliente deve exibir a lista dos proprios agendamentos.
- O cliente deve visualizar todos os seus agendamentos, independentemente da data.
- Deve existir um botao flutuante no canto inferior direito para abrir a modal de novo agendamento.
- O botao flutuante de novo agendamento deve usar apenas o icone `+`.
- O fluxo de agendamento do cliente deve ser:
- Exibir primeiro os barbeiros disponiveis
- Ao selecionar um barbeiro, exibir um calendario proprio da aplicacao
- O calendario deve permitir selecionar mes e ano
- O calendario deve exibir os dias do mes com indicacao de disponibilidade
- Dias com horarios disponiveis devem exibir a quantidade de `vagas`
- Dias sem horarios livres devem exibir `Sem vagas`
- Ao selecionar o dia, exibir apenas os horarios disponiveis retornados pela API
- Depois permitir selecionar o servico
- Ao finalizar, o agendamento deve aparecer na tela inicial
- O calendario pode usar marcador verde para dias com disponibilidade e vermelho para dias sem horarios livres.
- O cliente so pode visualizar horarios com no minimo 2 horas de antecedencia.
- Quando um agendamento for alterado por barbeiro ou administrador, a tela inicial do cliente deve exibir um badge no agendamento indicando que houve alteracao.
- Na listagem de agendamentos, cada item deve possuir menu de 3 pontos.
- O cliente deve conseguir cancelar o agendamento respeitando o limite minimo de 3 horas de antecedencia.
- No menu de 3 pontos do cliente, a acao deve aparecer como `Cancelar agendamento`.
- Ao solicitar o cancelamento, deve abrir uma modal de confirmacao informando a regra de 3 horas de antecedencia.
- A agenda do cliente deve possuir filtro por status dentro do proprio componente da listagem.
- Agendamentos cancelados devem aparecer no final da lista.

## Login Barbeiro

- A tela inicial do barbeiro deve exibir a lista dos seus agendamentos.
- O barbeiro deve visualizar apenas os agendamentos do dia selecionado.
- Cada agendamento deve exibir horario, nome do cliente e servico.
- Cada item deve ter um menu de 3 pontos que abre uma modal para alteracoes.
- O menu de 3 pontos deve ficar fixado no canto superior direito do card.
- O barbeiro pode alterar dia e horario do agendamento caso ainda faltem no minimo 12 horas para o atendimento.
- O barbeiro pode alterar o tipo de servico do agendamento sem restricao de antecedencia.
- O barbeiro tambem pode cancelar o agendamento pela modal respeitando a regra de 12 horas para alteracao de horario.
- O barbeiro deve possuir uma area separada para disponibilidade, onde pode ativar ou desativar horarios livres.
- A agenda do barbeiro deve possuir filtro por status dentro do proprio componente da listagem.
- Agendamentos cancelados devem aparecer no final da lista.

## Login Admin

- A tela inicial do administrador deve exibir a lista de agendamentos de todos os barbeiros.
- O administrador deve visualizar a agenda diaria do dia selecionado.
- Cada item deve exibir horario, nome do cliente, nome do barbeiro e servico.
- Cada item deve possuir menu de 3 pontos que abre uma modal para editar o agendamento.
- O menu de 3 pontos deve ficar fixado no canto superior direito do card.
- O administrador pode alterar dia, horario e servico sem restricao de antecedencia.
- O administrador pode cancelar ou excluir agendamentos pela modal.
- A agenda administrativa deve possuir busca textual.
- A busca textual deve permitir procurar por nome do cliente, nome do barbeiro ou nome do servico.
- A agenda administrativa tambem deve possuir filtros estruturados por barbeiro e por servico.
- A agenda administrativa deve possuir tambem filtro por status dentro do proprio componente da listagem.
- Agendamentos cancelados devem aparecer no final da lista.

## Navegacao Administrativa

- O administrador nao deve ter tudo na mesma tela.
- Deve existir um menu de navegacao com secoes separadas.
- O menu inicial sugerido deve conter:
- Agenda
- Administrativo
- Financeiro

## Menu Administrativo

### Cadastro de Barbeiro

- O cadastro de barbeiro deve abrir em modal.
- Deve permitir informar nome, e-mail, senha e servicos habilitados.
- Os horarios disponiveis padrao do barbeiro devem ser gerados automaticamente pelo backend.
- O padrao inicial deve ser de segunda a sexta, das 08:00 as 18:00, com atendimentos de 45 minutos.
- O sistema deve gerar disponibilidade para os proximos 12 meses.

### Cadastro de Servico

- O cadastro de servico deve abrir em modal.
- Deve permitir nome do servico e valor em BRL.
- Deve ser possivel listar os servicos cadastrados.
- Deve ser possivel editar servicos cadastrados.
- Em vez de apagar servicos, o sistema deve apenas desativar o servico.
- Servicos desativados continuam visiveis em agendamentos antigos.
- Servicos desativados nao devem aparecer para novos agendamentos.

## Experiencia do Usuario

- O frontend deve usar modais para fluxos de acao curta, como agendamento, edicao de agendamento e cadastros administrativos.
- O frontend deve usar separacao clara entre agenda, disponibilidade, financeiro e cadastros.
- O sistema deve reduzir ao maximo a necessidade de digitacao manual em fluxos de agenda, priorizando selecao visual.
- A home nao precisa exibir informacoes redundantes como `Perfil:` ou `Sessao ativa`.
- O botao `Sair` deve permanecer sempre no canto superior direito.
- Os badges de status devem ser visuais e consistentes:
- `Confirmado` com fundo branco, borda verde e texto verde
- `Concluido` com fundo verde
- `Cancelado` com fundo vermelho
- `Alterado` com badge proprio e facil identificacao
- `Pago` com badge proprio
- O layout mobile deve ser tratado como prioridade de refinamento visual, evitando quebra do menu de acoes e desperdicio de espaco.
- Os filtros da agenda devem ficar dentro do componente da propria agenda para economizar espaco.

## Historico Consolidado Do Frontend Ja Implementado

- Tela unica de autenticacao com alternancia entre login e cadastro
- Header simplificado, com remocao de informacoes redundantes
- Botao de logout fixado no topo direito
- Agenda com listagem adaptada por perfil
- Filtros embutidos na agenda em vez de cards separados
- Menu de 3 pontos padronizado no topo direito dos cards de agendamento
- Fluxo de cancelamento do cliente com confirmacao dedicada
- Novo fluxo de agendamento do cliente com barbeiro, calendario, dia, horario e servico
- Calendario customizado com vagas por dia, selecao de mes e ano e destaque visual de disponibilidade
- Uso exclusivo da disponibilidade retornada pela API para evitar horarios falsamente exibidos como livres
- Refinos de responsividade para mobile em header, tabs, listagem, agenda, filtros, modal e botao flutuante
