// Personalize cada vídeo alterando apenas este objeto.
const VIDEO_CONFIG = {
  title: "VISUAL EXPERIMENT / 001",
  accent: "#ed123b",
  lines: [
    { text: "const ", highlight: "gossip", rest: " = () => {" },
    { text: "  everyone ", highlight: "talks", rest: " about it;", comment: "// don't tell anyone", tag: "jack" },
    { text: "  the ", highlight: "story", rest: " keeps moving;" },
    { text: "  words become ", highlight: "noise", rest: "..." },
    { text: "  return ", highlight: "repeat", rest: "(gossip);" , comment: "// everyone" },
    { text: "};", cursor: true },
    { text: " " },
    { text: "while (", highlight: "true", rest: ") {" },
    { text: "  say(", highlight: "nothing", rest: ");", comment: "// too late" },
    { text: "}", cursor: true }
  ]
};
