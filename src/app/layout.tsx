import Script from "next/script";
import "@/styles/tailwind.css";
import "@/styles/animation.css";
import "aos/dist/aos.css";
import { kanit } from "@/lib/fonts";
import Providers from "@/components/providers";
import Navbar from "@/components/Navbar";

export { metadata } from "@/lib/metadata";

export default ({ children }: Props) => (
  <html className="!scroll-smooth" lang="en" suppressHydrationWarning>
    <body
      style={kanit.style}
      className="min-h-screen w-full bg-aura bg-cover bg-no-repeat text-white"
    >
      <Providers>
        <Navbar />
        {children}
      </Providers>

      {/* เปลี่ยนมาใช้ <Script> ของ Next.js แบบนี้ครับ */}
      <Script 
        src="https://a.webmash.io/js/script.js" 
        data-host="https://a.webmash.io" 
        data-dnt="false" 
        id="ZwSg9rf6GA" 
        strategy="afterInteractive" 
      />
    </body>
  </html>
);

type Props = {
  children: React.ReactNode;
};
