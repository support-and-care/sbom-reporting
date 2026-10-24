import { Lato, Montserrat } from "next/font/google";

// Google Fonts only ships Lato in 400/700/900; the design's 600 and 800 fall back to the nearest of these.
export const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});
