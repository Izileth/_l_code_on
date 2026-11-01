# Code Music Video — Etapa 2

Template vertical 9:16 em HTML, CSS e JavaScript puro.

## Executar
Abra `index.html` com Live Server no VS Code. Carregue um arquivo de áudio pelo botão na tela e pressione PLAY.

## Personalizar
Edite `js/config.js`:
- `title`: identificação da faixa;
- `accent`: cor de destaque;
- `lines`: conteúdo e tempo de entrada de cada linha;
- `commentAt` / `tagAt`: instante em que comentários e etiquetas aparecem;
- `camera`: keyframes de posição, escala e rotação da câmera.

Os tempos são segundos desde o início da música. A animação usa `audio.currentTime`, então pausar, avançar ou retroceder também atualiza a composição.

## Limitação desta etapa
A animação acompanha o tempo da faixa, mas ainda não detecta automaticamente batidas. Exportação de vídeo MP4 será implementada em uma etapa posterior.
