import type { Metadata } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sora",
});

const jetBrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
	title: "Crashouse Fairness Tool",
	description: "Verify on-chain fairness for Crashouse crash games.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${sora.variable} ${jetBrainsMono.variable} antialiased`}>{children}</body>
		</html>
	);
}
