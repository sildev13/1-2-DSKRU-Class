import { Sarabun, Space_Grotesk } from "next/font/google";
import "@/styles/pb.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

export default function PointsLayout({ children }) {
  return (
    <div className={`pb-root ${sarabun.variable} ${space.variable}`}>{children}</div>
  );
}
