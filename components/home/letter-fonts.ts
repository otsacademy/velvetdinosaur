import localFont from "next/font/local"

// The Letter design's three faces. They are declared here rather than in the
// root layout so only pages inside DesignShell download and preload them;
// admin, editor and demo screens keep the fonts they already had. The files
// are self-hosted (see ./fonts/README.md), so builds never fetch them.

// Headlines and anything said with emphasis.
const letterSerif = localFont({
  src: [
    { path: "./fonts/newsreader-opsz60-roman.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/newsreader-opsz60-italic.woff2", weight: "400 700", style: "italic" },
  ],
  display: "swap",
  variable: "--font-letter-serif",
  adjustFontFallback: "Times New Roman",
})

// Body copy and labels.
const letterSans = localFont({
  src: [{ path: "./fonts/source-sans-3.woff2", weight: "400 700", style: "normal" }],
  display: "swap",
  variable: "--font-letter-sans",
  adjustFontFallback: "Arial",
})

// The handwriting: greetings, captions, margin notes and the sign-off.
const letterHand = localFont({
  src: [{ path: "./fonts/caveat-600.woff2", weight: "600", style: "normal" }],
  display: "swap",
  variable: "--font-letter-hand",
  adjustFontFallback: "Arial",
})

export const LETTER_FONT_VARIABLES = `${letterSerif.variable} ${letterSans.variable} ${letterHand.variable}`
