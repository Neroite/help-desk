import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import { SlaClockProvider } from "@/lib/sla-clock";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Help-Desk",
  description: "Sistema de help desk / gestão de tickets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${firaSans.variable} ${firaCode.variable} antialiased`}
      >
        <SlaClockProvider>{children}</SlaClockProvider>
      </body>
    </html>
  );
}
