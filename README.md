# Code Music Video — Etapa 3

Template vertical 9:16 em HTML, CSS e JavaScript puro.

## Executar
Abra `index.html` com Live Server no VS Code. Carregue um áudio local e pressione PLAY.

## Correção do áudio
A nova rotina pausa a faixa anterior, limpa a fonte antiga, aguarda `loadedmetadata` e só então libera a reprodução. O botão fica desabilitado durante a importação. AbortError decorrente de troca de fonte é tratado como cancelamento esperado.

## Cenas
Edite `js/config.js`. Cada cena possui:
- `type`: `code` ou `phrase`;
- `start` e `end`: intervalo da cena em segundos;
- `transition`: `blur` ou `glitch`;
- `camera`: keyframes com `at`, `x`, `y`, `scale` e `rotate`;
- `lines`: conteúdo de cenas de código;
- `eyebrow`, `text`, `highlight`, `smallText`: conteúdo de cenas tipográficas.

Os tempos são relativos ao início da música. A câmera interpola suavemente entre os keyframes.

## Próximas melhorias
Detecção automática de batidas, editor visual de timeline e exportação MP4.
