import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TDEE Tracker",
  description: "Adaptive TDEE tracker for bodybuilding bulks and cuts",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.variable}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
