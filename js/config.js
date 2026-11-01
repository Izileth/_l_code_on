// CONFIGURAÇÃO DO VÍDEO
// Os tempos são em segundos, contados desde o início da música.
const VIDEO_CONFIG = {
  title: "VISUAL EXPERIMENT / 003",
  accent: "#ed123b",

  scenes: [
    {
      type: "code",
      start: 0,
      end: 7,
      transition: "blur",
      camera: [
        { at: 0, x: 0, y: 0, scale: 1.05, rotate: -1 },
        { at: 7, x: -3, y: -2, scale: 1.18, rotate: 1 }
      ],
      lines: [
        { at: 0.2, text: "const ", highlight: "gossip", rest: " = () => {" },
        { at: 1.1, text: "  everyone ", highlight: "talks", rest: " about it;", comment: "don't tell anyone", commentAt: 3.0, tag: "jack", tagAt: 4.0 },
        { at: 4.2, text: "  return ", highlight: "repeat", rest: "(gossip);" },
        { at: 5.7, text: "};", cursor: true }
      ]
    },
    {
      type: "phrase",
      start: 7,
      end: 11,
      transition: "glitch",
      camera: [
        { at: 7, x: 0, y: 0, scale: 1.0, rotate: 0 },
        { at: 11, x: 2, y: -1, scale: 1.12, rotate: -1 }
      ],
      eyebrow: "THE STORY",
      text: "EVERYBODY",
      highlight: "IS WATCHING",
      smallText: "and nobody knows who started it."
    },
    {
      type: "code",
      start: 11,
      end: 17,
      transition: "blur",
      camera: [
        { at: 11, x: 2, y: 0, scale: 1.15, rotate: 1 },
        { at: 17, x: -2, y: 2, scale: 1.28, rotate: -1 }
      ],
      lines: [
        { at: 11.2, text: "if (", highlight: "secret", rest: ") {" },
        { at: 12.1, text: "  spread(", highlight: "rumors", rest: ");", comment: "too late", commentAt: 14.0 },
        { at: 15.0, text: "}", cursor: true }
      ]
    },
    {
      type: "phrase",
      start: 17,
      end: 23,
      transition: "glitch",
      camera: [
        { at: 17, x: -2, y: 1, scale: 1.0, rotate: 0 },
        { at: 23, x: 0, y: -2, scale: 1.16, rotate: 1 }
      ],
      eyebrow: "NO WAY BACK",
      text: "WORDS",
      highlight: "BECOME NOISE",
      smallText: "the echo outlives the truth."
    }
  ]
};
