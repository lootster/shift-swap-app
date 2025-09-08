import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift Swap - Apple Retail",
  description: "Find shift swap partners at Apple Retail",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
