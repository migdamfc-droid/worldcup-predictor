import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "World Cup 2026 Predictor",
  description: "Predict the FIFA World Cup 2026 bracket and compete with friends!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('theme') === 'light') {
              document.documentElement.classList.remove('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-screen antialiased bg-zinc-100 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
