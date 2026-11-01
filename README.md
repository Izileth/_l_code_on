# Code Music Video — Etapa 4

Template vertical 9:16 em HTML, CSS e JavaScript puro para videoclipes musicais com estética de código e tipografia cinética.

## Como Executar
Abra `index.html` com a extensão **Live Server** no VS Code ou qualquer servidor HTTP estático local.

## Novo Sistema: Anexo de Áudio & Geração de Letras

1. **Anexo Automático e Análise Espectral**:
   - Clique em **CARREGAR ÁUDIO** ou arraste e solte o arquivo de áudio diretamente na tela 9:16.
   - O nome da faixa é limpo e exibido no cabeçalho.
   - A **Web Audio API** analisa os canais do áudio em tempo real, calculando a duração exata, o perfil de energia RMS e detectando picos de batidas/drops.
   - Cenas de código e frases tipográficas são **geradas automaticamente para 100% da duração da música**.

2. **Gerador e Sincronizador de Letras (Botão GERAR LETRAS)**:
   - **Geração Automática do Áudio**: Cria cenas sincronizadas com batidas, transições de glitch e efeitos de câmera.
   - **Colar Letra da Música**: Permite colar a letra da música (com ou sem marcações `[Verse]`/`[Chorus]`). O algoritmo converte versos em código animado com destaques de sintaxe e refrões em frases de alto impacto.
   - **Arquivos .LRC**: Suporte a arquivos `.lrc` com timestamps precisos (`[mm:ss.xx]`).
   - **Reconhecimento de Voz**: Permite ditar as letras usando a Web Speech API.
   - **Seletor de Temas e Cores**: Cyberpunk Code, Sintetizador DSP ou Minimalista, com paletas de cores customizáveis.

3. **Linha do Tempo Interativa**:
   - Barra de progresso interativa no rodapé com indicador de tempo decorrido e duração total (`mm:ss / mm:ss`).
   - Clique em qualquer ponto da barra para avançar ou retroceder a reprodução e a animação instantaneamente.

4. **Reatividade a Graves (Bass Reactive Visuals)**:
   - Integração com `AnalyserNode` para pulsos sutis de escala na câmera e brilho acompanhando as batidas graves da música.
