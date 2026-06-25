import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("http://room1-2.suphason.space/"),
  title: "1/2 Room Website",
  description: "เว็บไซต์ห้อง 4/11 สุดตึง",
  icons: [
    {
      url: "/icon.jpg",
      href: "/icon.jpg",
    },
  ],
  openGraph: {
    title: "1/2 Room Website",
    description: "เว็บไซต์ห้อง 1/2 สุดตึง ตึงจนเป้าขาด",
    url: "http://room1-2.suphason.space/",
    siteName: "http://room1-2.suphason.space/",
    locale: "en_US",
    type: "website",
    images: ["/dskru.png"],
  },
};
