# Especificação Técnica: Chat, Jogos, Calculadora e Quadro Kanban Premium

Este documento detalha a arquitetura, requisitos e a implementação para a inclusão da funcionalidade **Quadro Kanban**, inspirada no sistema de design e na paleta de cores do site do Claude Code (Anthropic).

---

## 1. Sumário Executivo

A plataforma AuraTech será expandida com um **Quadro Kanban** interativo para gerenciamento de fluxo de trabalho. A funcionalidade será acessível a partir da página principal (`index.html`) e utilizará a identidade visual refinada do site do Claude Code: fundos creme claro, tipografia dividida entre fontes sem serifa modernas e fontes serifadas clássicas, e acentos em terracota/laranja, verde sálvia e azul acinzentado. O sistema permitirá arrastar e soltar (drag and drop) cartões entre quatro colunas, comemorar tarefas concluídas com chuva de confetes e alternar dinamicamente para uma exibição em formato de Lista de Tarefas Pendentes (excluindo as concluídas).

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais

#### Integração na Página Principal (`index.html`):
- **Link de Acesso:** Adicionar um atalho de navegação no cabeçalho e um card na seção "Interactive Utilities" para o Quadro Kanban (`kanban.html`).

#### Tela do Quadro Kanban (`kanban.html`):
- **Visualização em Quadro (Kanban View):**
  - Quatro colunas dispostas lado a lado de forma responsiva:
    1. **Funnel** (Funil / Ideias)
    2. **To Do** (A Fazer)
    3. **Doing** (Em Progresso)
    4. **Done** (Concluído)
  - Suporte completo a **arrastar e soltar (Drag and Drop)** nativo do HTML5.
  - Efeito visual de destaque (hover) ao arrastar um cartão sobre uma coluna válida.
  - **Chuva de Confetes:** Ao mover qualquer item para a última coluna (**Done**), o sistema dispara uma chuva de confetes (`canvas-confetti`) para comemorar.
- **Visualização em Lista (List View):**
  - Exibe todos os itens cujo status é **diferente de Done** (não encerrados) em formato de lista/tabela limpa.
  - Permite visualizar rapidamente ID, Título, Categoria, Tags e Status.
- **Alternância de Visualização (Toggle View):**
  - Um botão de controle de visualização no cabeçalho permite alternar instantaneamente entre a visualização de **Quadro Kanban** e a **Lista de Pendentes** sem perder dados.
- **Criação de Itens (Workitems):**
  - Botão "Add Workitem" que abre um modal para inserir:
    - **Título** (Texto)
    - **Categoria** (Seleção: Feature, Bug, Docs, Design, etc.)
    - **Tags** (Lista flexível de palavras-chave inseridas por vírgula)
    - **Status Inicial** (Dropdown com as opções Funnel, To Do, Doing)
  - Cada item gerado recebe automaticamente um **ID sequencial único** (ex: `K-1`, `K-2`).
- **Persistência de Dados (Local):**
  - Utilização de `localStorage` no navegador para salvar e carregar os cartões criados e suas posições, para que o progresso não seja perdido ao recarregar a página.

### 2.2 Requisitos Não Funcionais
- **Paleta de Cores (Estilo Claude Code):**
  - **Fundo Base:** Creme suave (`#faf9f5`)
  - **Texto Principal:** Carvão escuro (`#141413`)
  - **Bordas e Linhas:** Cinza claro acinzentado (`#e8e6dc`)
  - **Cor de Destaque 1 (Laranja/Terracota):** `#d97757` (Usado para botões primários e marcações do To Do)
  - **Cor de Destaque 2 (Azul Acinzentado):** `#6a9bcc` (Usado para informações, categorias e Doing)
  - **Cor de Destaque 3 (Verde Sálvia):** `#788c5d` (Usado para o status Done e celebrações)
- **Tipografia:**
  - Títulos e Cabeçalhos: Fonte `Poppins` (Google Fonts) para um ar corporativo e moderno.
  - Corpo de texto, formulários e descrições: Fonte serifada `Lora` (Google Fonts) ou fallback `Georgia`, imitando o estilo editorial e acadêmico da Anthropic.
- **Responsividade:** Colunas de Kanban se organizam em grid vertical (1 coluna) em telas móveis e 4 colunas horizontais em telas largas.

---

## 3. Arquitetura e Stack Tecnológico

A lógica de manipulação do Quadro Kanban e os dados do estado dos itens serão geridos inteiramente no lado do cliente (Client-Side).

### Tecnologias Utilizadas
- **HTML5 nativo** com APIs de Drag and Drop.
- **CSS3 Vanilla** com variáveis baseadas na paleta do Claude.
- **JavaScript ES6+** para estruturação dos cartões, persistência no `localStorage`, gerenciamento do modal e lógica de troca de visualização.
- **canvas-confetti** carregado via CDN para a comemoração de tarefas concluídas.

### Estrutura de Arquivos Atualizada
```diff
 app_build/
 └── public/
     ├── index.html          # Adicionado link para o Kanban
+    ├── kanban.html         # Nova interface do Quadro Kanban
     ├── css/
     │   ├── style.css
+    │   └── kanban.css      # Estilos com fontes Lora/Poppins e paleta Claude
     └── js/
+        └── kanban.js       # Controle de drag-and-drop, localStorage e toggle de telas
```

---

## 4. Plano de Verificação

### Testes Manuais
1. **Criação de Cards:** Clicar em "Add Workitem", preencher os campos do formulário e salvar. Verificar se o card aparece na coluna correta com ID gerado (`K-1`, `K-2`, etc.) e estilização correspondente.
2. **Drag & Drop:**
   - Arrastar um item de "Funnel" para "Doing".
   - Arrastar um item de "Doing" para "Done" e validar se a animação de confetes é disparada imediatamente.
   - Recarregar a página e garantir que a nova posição do card foi salva.
3. **Alternância de Visualização (Toggle):**
   - Mudar para a visualização de "Lista de Pendentes" e verificar se apenas os itens que *não* estão em "Done" são listados.
   - Mudar de volta para o "Quadro Kanban" e checar se o layout volta ao normal com os cards nos mesmos locais.
