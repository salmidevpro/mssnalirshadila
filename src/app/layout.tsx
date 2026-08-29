import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSSN Al-Irshad Model School",
  description:
    "MSSN Al-Irshad Model School — Concretising faith through knowledge acquisition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}