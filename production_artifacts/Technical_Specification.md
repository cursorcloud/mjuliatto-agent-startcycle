# Especificação Técnica: Chat de Suporte, Jogo da Velha e Calculadora Estilo iPhone

Este documento detalha a arquitetura, requisitos e a implementação para a inclusão de uma nova funcionalidade de **Calculadora Simples** inspirada no design clássico do iPhone, integrada com a aplicação AuraTech existente.

---

## 1. Sumário Executivo

A plataforma AuraTech será estendida com uma **Calculadora Simples** baseada no aplicativo nativo do iOS/iPhone. A funcionalidade será acessível através de um link na página principal (`index.html`). O design da calculadora adotará a interface icônica da Apple: botões redondos, fundo preto, display com fonte responsiva, e as cores originais da marca (laranja para operadores, cinza claro para funções de limpeza, e cinza escuro para numerais).

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais

#### Integração na Página Principal (`index.html`):
- **Link de Acesso:** Adicionar um link/botão elegante na barra de navegação principal e na seção correspondente para abrir a calculadora (`calculator.html`).

#### Tela da Calculadora (`calculator.html`):
- **Design de Interface (Estilo iPhone):**
  - Fundo escuro profundo (`#000000` ou cinza escuro com efeito de vidro).
  - Display digital no topo exibindo o número atual, com tamanho de fonte dinâmico (diminui à medida que o número cresce, igual ao iOS).
  - Grade de botões redondos perfeitamente dispostos (padrão 4x5).
- **Esquema de Cores dos Botões (iOS Palette):**
  - **Operadores (Laranja - `#FF9F0A`):** Divisão (`÷`), Multiplicação (`×`), Subtração (`-`), Adição (`+`) e Igual (`=`).
  - **Funções Especiais (Cinza Claro - `#A5A5A5` com texto escuro):** Limpar (`AC` / `C`), Inverter Sinal (`+/-`) e Porcentagem (`%`).
  - **Numerais e Ponto (Cinza Escuro - `#333333`):** Números de `0` a `9` e o ponto decimal (`.`). O botão `0` é alongado horizontalmente, cobrindo duas colunas.
- **Mecânica da Calculadora:**
  - Operações básicas (soma, subtração, multiplicação e divisão).
  - Cálculo de porcentagem (`%`).
  - Alternância de sinal positivo/negativo (`+/-`).
  - Botão de limpar (alterna dinamicamente entre `AC` quando zerado e `C` quando há números digitados).
  - Limite de caracteres no display para evitar overflow visual, com arredondamento preciso para números flutuantes.

### 2.2 Requisitos Não Funcionais
- **Responsividade:** O teclado da calculadora deve caber perfeitamente em telas móveis e desktop, simulando o formato e proporção de um iPhone.
- **Acessibilidade:** Suporte a teclas numéricas e operadores do teclado físico do computador para digitação facilitada.
- **Design Estético Premium:** Sombras internas nos botões ao clicar (active states), transições suaves e cantos arredondados.

---

## 3. Arquitetura e Stack Tecnológico

Toda a lógica da calculadora rodará inteiramente no cliente (frontend), integrada na estrutura estática existente.

### Tecnologias Utilizadas
- **HTML5 Semântico:** Estruturação da calculadora utilizando tags de botão apropriadas.
- **CSS3 Vanilla (Custom Properties):** Estilização baseada em variáveis de cores oficiais do iOS.
- **JavaScript Vanilla (ES6+):** Lógica matemática e gerenciamento de display.

### Estrutura de Arquivos Atualizada
```diff
 app_build/
 └── public/
     ├── index.html          # Adicionado link para a Calculadora
+    ├── calculator.html     # Nova interface da Calculadora
     ├── css/
     │   ├── style.css
+    │   └── calculator.css  # Estilo específico simulando o iPhone
     └── js/
+        └── calculator.js   # Lógica matemática e dinâmica de botões
```

---

## 4. Plano de Verificação

### Testes Manuais
1. **Navegação:** Clicar no link de Calculadora na página inicial e confirmar que ela abre.
2. **Operações Básicas:**
   - Testar `5 + 5 = 10`
   - Testar `10 - 3.5 = 6.5`
   - Testar `4 × 8 = 32`
   - Testar `20 ÷ 4 = 5`
3. **Funções Especiais:**
   - Inserir um número e testar a tecla `%` (deve dividir por 100).
   - Testar o botão `+/-` (deve inverter o sinal).
   - Testar o botão `C` para limpar a entrada atual e `AC` para zerar o acumulador.
4. **Layout:** Testar responsividade e o comportamento do botão "0" (que deve ocupar duas colunas).
