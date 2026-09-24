import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Shell from "@/components/Shell";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Studio — influenceuses IA",
  description: "Inspiration, création, publication et performances des influenceuses IA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body className="font-sans antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
