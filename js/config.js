// Edite este arquivo para criar um novo videoclipe.
// Os tempos são em segundos e acompanham a música carregada.
const VIDEO_CONFIG = {
  title: "VISUAL EXPERIMENT / 001",
  accent: "#ed123b",

  // Cada linha começa a ser digitada no segundo indicado.
  // O comentário aparece separadamente em commentAt.
  lines: [
    { start: 0.0,  text: "const ", highlight: "gossip", rest: " = () => {", comment: "everybody is listening", commentAt: 2.2 },
    { start: 3.0,  text: "  everyone ", highlight: "talks", rest: " about it;", comment: "don't tell anyone", commentAt: 5.0, tag: "jack", tagAt: 5.8 },
    { start: 6.5,  text: "  the ", highlight: "story", rest: " keeps moving;" },
    { start: 9.0,  text: "  words become ", highlight: "noise", rest: "...", comment: "too loud to ignore", commentAt: 11.0 },
    { start: 12.0, text: "  return ", highlight: "repeat", rest: "(gossip);", comment: "no way back", commentAt: 14.2 },
    { start: 15.5, text: "};", cursor: true },
    { start: 18.0, text: "while (", highlight: "true", rest: ") {" },
    { start: 20.0, text: "  say(", highlight: "nothing", rest: ");", comment: "silence is also an answer", commentAt: 22.0 },
    { start: 24.0, text: "}", cursor: true }
  ],

  // A câmera interpola entre estes pontos usando o tempo da música.
  camera: [
    { at: 0,  x: 0,   y: 0,   scale: 1.02, rotate: -1.0 },
    { at: 5,  x: -3,  y: -2,  scale: 1.10, rotate: -1.8 },
    { at: 10, x: 2,   y: -5,  scale: 1.18, rotate: -0.8 },
    { at: 16, x: 5,   y: 1,   scale: 1.28, rotate: 0.5 },
    { at: 22, x: -4,  y: 3,   scale: 1.16, rotate: -1.5 },
    { at: 28, x: 0,   y: 0,   scale: 1.08, rotate: 0 }
  ]
};
