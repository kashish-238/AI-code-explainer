import "./globals.css";
import type { Metadata } from "next";
import NavBar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "ClearCode",
  description: "Understand Code. Learn Smarter.",
  icons: {
    icon: "/clearcode-icon.png", // or .svg if you used svg
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="bg-[#0B0F19] text-white"
        suppressHydrationWarning
      >
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
