# Especificação Técnica: Chat de Suporte ao Cliente em Tempo Real

Este documento detalha a arquitetura, requisitos e o protocolo de comunicação para a aplicação de Chat de Suporte ao Cliente em Tempo Real.

---

## 1. Sumário Executivo

A aplicação é um sistema leve de chat de suporte ao cliente projetado para permitir comunicação bidirecional em tempo real entre visitantes do site (clientes) e agentes de suporte. O sistema utiliza WebSockets para garantir entrega instantânea de mensagens e atualizações de status sem a necessidade de requisições periódicas (polling).

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais

#### Fluxo do Cliente (Página Principal):
- **Formulário de Onboarding:** Antes de iniciar o chat, o cliente insere seu Nome e E-mail. Validações básicas de formulário garantem integridade dos dados.
- **Widget Flutuante:** O chat reside em um widget flutuante moderno no canto inferior direito da tela, usando a API nativa de popovers do HTML5.
- **Mensagem de Boas-Vindas:** Uma mensagem automática é enviada pelo sistema assim que o chat é iniciado.
- **Histórico e Persistência:** A sessão é persistida em `sessionStorage`. Se o cliente recarregar a página, a conversa é restaurada automaticamente com o histórico de mensagens.
- **Indicador de Digitação:** O cliente visualiza quando o agente está digitando em tempo real.
- **Contador de Mensagens Não Lidas:** Se o widget estiver fechado e uma nova mensagem do agente chegar, um balão indicador exibe a contagem de não lidas.

#### Fluxo do Agente (Painel de Atendimento):
- **Fila de Espera:** Novos chats entram em uma fila compartilhada. Todos os agentes conectados visualizam a fila em tempo real.
- **Reivindicação de Chat (Claim):** Um agente pode assumir o atendimento de um cliente. Isso altera o status da sessão para "active".
- **Comunicação Direta:** Uma vez reivindicado, o agente e o cliente conversam diretamente.
- **Encerramento de Conversa:** O agente pode encerrar o atendimento a qualquer momento, o que desabilita novas mensagens no lado do cliente.
- **Indicador de Digitação:** O agente visualiza quando o cliente está digitando.

### 2.2 Requisitos Não Funcionais
- **Baixa Latência:** Comunicação orientada a eventos via WebSockets (`ws` no Node.js).
- **Sem Banco de Dados (In-Memory):** Armazenamento em memória no servidor para sessões e conexões ativas.
- **UI/UX Premium:** Design limpo, responsivo, com tipografia moderna (Outfit e Inter) e efeitos visuais fluidos.

---

## 3. Arquitetura e Stack Tecnológico

A aplicação adota uma arquitetura cliente-servidor monolítica simples baseada em Node.js.

### Tecnologias Utilizadas
- **Backend:** Node.js v18+, Express (serviço de arquivos estáticos), módulo `ws` (WebSockets nativos).
- **Frontend:** HTML5 Semântico, CSS3 Vanilla (com variáveis de ambiente/CSS Custom Properties), Javascript ES6+.
- **Protocolo:** JSON sobre WebSockets.

### Estrutura de Arquivos
```
app_build/
├── server.js               # Servidor Express & WebSocket
├── package.json            # Manifesto e dependências (express, ws)
├── Dockerfile              # Dockerização da aplicação
└── public/                 # Recursos estáticos do frontend
    ├── index.html          # Página institucional AuraTech + Widget do Cliente
    ├── agent.html          # Painel Administrativo do Agente
    ├── css/
    │   └── style.css       # Design global, popover e variáveis CSS
    └── js/
        ├── client.js       # Lógica do chat no lado do cliente
        └── agent.js        # Lógica do chat no lado do agente
```

---

## 4. Protocolo de Comunicação WebSocket

Toda a troca de mensagens ocorre em formato JSON, seguindo a estrutura `{ type: string, payload: object }`.

### Mensagens enviadas pelos Clientes / Agentes para o Servidor

| Tipo (`type`) | Enviado por | Descrição | Payload Exemplo |
| :--- | :--- | :--- | :--- |
| `customer_init` | Cliente | Inicia ou reconecta uma sessão de chat | `{ name: "John", email: "john@ex.com", sessionId: "uuid" }` |
| `agent_init` | Agente | Registra o atendente no painel | `{ agentId: "uuid", name: "Agent Maria" }` |
| `msg` | Ambos | Envia uma nova mensagem | `{ sessionId: "uuid", text: "Olá", sender: "customer" }` |
| `typing` | Ambos | Informa se o usuário está digitando | `{ sessionId: "uuid", isTyping: true, sender: "customer" }` |
| `claim` | Agente | Reivindica uma conversa da fila | `{ sessionId: "uuid", agentId: "uuid", agentName: "Agent Maria" }` |
| `close` | Agente | Encerra a conversa ativa | `{ sessionId: "uuid" }` |

### Mensagens enviadas pelo Servidor para Clientes / Agentes

| Tipo (`type`) | Destinatário | Descrição | Payload Exemplo |
| :--- | :--- | :--- | :--- |
| `session_ready` | Cliente | Confirma o registro e retorna histórico | `{ sessionId: "uuid", status: "queue", messages: [...] }` |
| `claim_success` | Cliente | Notifica que um agente assumiu a conversa | `{ agentName: "Agent Maria", status: "active", message: {...} }` |
| `msg` | Ambos | Distribui a mensagem enviada | `{ sessionId: "uuid", message: { id: "uuid", sender: "...", text: "...", timestamp: "..." } }` |
| `typing` | Ambos | Repassa o estado de digitação para a outra ponta | `{ sessionId: "uuid", sender: "agent", isTyping: true }` |
| `session_closed` | Cliente | Notifica o fim da sessão de atendimento | `{ status: "closed", message: {...} }` |
| `init_ok` | Agente | Confirma registro do agente e envia snapshots | `{ agentId: "uuid", sessions: { ... } }` |
| `sessions_update` | Agente | Envia a lista atualizada de todas as sessões | Lista de sessões ativas e na fila |
| `new_queue_alert` | Agente | Alerta sobre um novo cliente aguardando atendimento | `{ name: "John", email: "john@ex.com", sessionId: "uuid" }` |

---

## 5. Gerenciamento de Estado

### Servidor (In-Memory)
- **`sessions`:** Dicionário indexado por `sessionId`. Cada sessão possui dados do cliente, status atual (`queue`, `active`, `closed`), histórico de mensagens e o socket ativo (`customerSocket`).
- **`agents`:** Dicionário indexado por `agentId` mapeando conexões WebSocket de agentes ativos para distribuição de transmissões em broadcast.

### Cliente (Browser)
- **`sessionStorage`:** Armazena `chat_session_id`, `chat_name` e `chat_email` para persistência de estado durante recarregamento de páginas ou navegação.
