import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./planner-polish.css";

export const metadata: Metadata = {
  title: "Nolazco Labs Resource Forecasting",
  description: "Resource forecasting, allocation, utilization and capacity planning.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f7f5f0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
