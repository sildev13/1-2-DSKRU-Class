import { NextFont } from "next/dist/compiled/@next/font";
import { Kanit } from "next/font/google";

export const kanit: NextFont = Kanit({
  subsets: ["thai", "latin"],
  weight: "400",
});
