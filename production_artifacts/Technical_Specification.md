# Especificação Técnica: Jogo da Velha com Ícones do iPhone e Efeitos Premium

Este documento detalha a arquitetura, requisitos e a implementação para a inclusão de um jogo da velha temático com ícones do iPhone, acessível a partir da página principal da aplicação.

---

## 1. Sumário Executivo

A aplicação existente (Chat de Suporte) será expandida com a adição de um Jogo da Velha interativo. O jogo estará disponível através de um link/botão destacado na página principal (`index.html`). O diferencial deste Jogo da Velha é o uso de imagens/vetores de ícones clássicos do iOS (iPhone) em substituição aos tradicionais "X" e "O". Os jogadores poderão selecionar seus respectivos ícones a partir de uma galeria com 10 opções premium. Ao finalizar o jogo com uma vitória, haverá uma celebração interativa com chuva de confetes na tela.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais

#### Integração na Página Principal (`index.html`):
- **Link de Acesso:** Um botão/link elegante e estilizado (estilo Apple) posicionado de forma visível na página principal que direciona o usuário para a página do Jogo da Velha (`tictactoe.html`).

#### Tela do Jogo da Velha (`tictactoe.html`):
- **Configuração de Jogadores (Onboarding):**
  - O jogador 1 e o jogador 2 escolhem seus respectivos "ícones" de jogo a partir de uma galeria contendo 10 ícones clássicos do iPhone.
  - Regra de validação: O jogador 2 não pode escolher o mesmo ícone selecionado pelo jogador 1.
  - Exibição visual clara dos ícones selecionados por cada jogador.
- **Galeria de 10 Ícones do iPhone (SVGs inline e responsivos):**
  1. **Safari** (Bússola azul/vermelha)
  2. **App Store** (Letra 'A' branca sobre fundo azul)
  3. **Messages** (Balão verde com contorno branco)
  4. **Phone** (Telefone branco sobre fundo verde)
  5. **Mail** (Envelope branco sobre fundo azul)
  6. **Photos** (Flor de pétalas coloridas)
  7. **Camera** (Câmera fotográfica médica/cinza)
  8. **Settings** (Engrenagem cinza escuro)
  9. **Music** (Nota musical branca sobre fundo rosa/vermelho)
  10. **Maps** (Indicador de mapa com pin vermelho)
- **Tabuleiro de Jogo:**
  - Tabuleiro 3x3 responsivo, com design minimalista, sombras suaves e bordas arredondadas.
  - Alternância de turnos automática (Jogador 1 vs. Jogador 2).
  - Exibição de quem é a vez atual de jogar.
- **Fim de Jogo e Celebração:**
  - **Vitória:** O tabuleiro destaca a linha, coluna o diagonal vencedora. Uma animação de chuva de confetes (confetti shower) toma conta da tela.
  - **Empate ("Velha"):** Exibição de mensagem de empate amigável, com opção de reiniciar o jogo mantendo ou alterando os ícones.
  - **Reinício:** Botão para resetar o jogo mantendo os mesmos ícones ou retornando à tela de seleção de ícones.

### 2.2 Requisitos Não Funcionais
- **Performance Visual:** Animações fluidas (60fps) para as interações e a chuva de confetes.
- **Acessibilidade:** Elementos interativos possuem estados `:hover` e `:focus` bem definidos, além de suporte a teclado para navegação.
- **Design Estético Premium (Aesthetics):** Interface seguindo o guia de design da Apple (Neumorfismo/Glassmorphism leve, cantos arredondados padrão iOS, cores vibrantes porém harmônicas e fontes modernas como *SF Pro* ou *Inter*).

---

## 3. Arquitetura e Stack Tecnológico

O jogo será integrado na estrutura estática da aplicação atual, sem necessidade de banco de dados ou backend dedicado (toda a lógica do jogo roda no lado do cliente).

### Tecnologias Utilizadas
- **Frontend:** HTML5 Semântico, CSS3 Vanilla (Custom Properties/Variáveis CSS para controle de temas e paleta iOS), JavaScript Vanilla (ES6+).
- **Biblioteca de Confetes:** Utilização da biblioteca leve e performática `canvas-confetti` carregada via CDN (ou implementada localmente em vanilla canvas caso prefira zero dependências externas).
- **Ícones:** Vetores SVG embutidos de forma limpa para garantir carregamento instantâneo e alta definição em qualquer tela.

### Estrutura de Arquivos Atualizada
```diff
 app_build/
 ├── server.js
 ├── package.json
 ├── Dockerfile
 └── public/
     ├── index.html          # Página principal (Adição do link para o Jogo da Velha)
+    ├── tictactoe.html      # Página do Jogo da Velha
     ├── css/
     │   ├── style.css
+    │   └── tictactoe.css   # Estilos específicos do jogo da velha e da galeria
     └── js/
         ├── client.js
         ├── agent.js
+        └── tictactoe.js    # Lógica de estados, tabuleiro, seleção de ícones e confete
```

---

## 4. Fluxo e Gerenciamento de Estado (Client-Side)

### Estados da Aplicação:
1. **`setup`:** Tela de seleção de ícones ativa. Tabuleiro oculto.
2. **`playing`:** Tabuleiro ativo. Jogadores alternando turnos.
3. **`finished`:** Tabuleiro bloqueado. Vencedor anunciado, confetes ativos e botão de reset visível.

### Variáveis Globais de Estado (`tictactoe.js`):
- `currentPlayer`: `1` ou `2`.
- `player1Icon`: Objeto SVG do ícone escolhido pelo Jogador 1.
- `player2Icon`: Objeto SVG do ícone escolhido pelo Jogador 2.
- `boardState`: Array de 9 posições representando o tabuleiro (ex: `[null, null, null, ...]`).
- `gameActive`: Boolean para travar o tabuleiro após vitória/empate.

---

## 5. Plano de Verificação

### Testes Manuais
1. **Navegação:** Clicar no link da página inicial (`index.html`) e verificar se redireciona corretamente para o jogo da velha.
2. **Seleção de Ícones:**
   - Testar seleção do Jogador 1 e depois do Jogador 2.
   - Validar que o Jogador 2 não consegue selecionar o mesmo ícone do Jogador 1 (o ícone correspondente deve ficar desabilitado ou com opacidade reduzida).
3. **Mecânica do Jogo:**
   - Jogar uma partida até a vitória e verificar se a chuva de confetes é disparada e a linha vencedora é destacada.
   - Jogar uma partida até o empate e verificar se a mensagem de "Velha" aparece corretamente.
   - Clicar em "Reiniciar" e verificar se o tabuleiro é limpo.
