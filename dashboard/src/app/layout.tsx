import { type ReactNode } from "react";
import Script from "next/script";

import "@/styles/globals.css";

import { env } from "@/env";
import EnvScript from "@/env-script";
import OledModeProvider from "@/components/OledModeProvider";
import { LiveDataProvider } from "@/contexts/LiveDataContext";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

export { metadata } from "@/metadata";
export { viewport } from "@/viewport";

type Props = Readonly<{
	children: ReactNode;
}>;

import TitleBar from "@/components/TitleBar";
import SidebarWrapper from "@/components/SidebarWrapper";
import GlobalHeader from "@/components/GlobalHeader";

export default function RootLayout({ children }: Props) {
	return (
		<html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} font-sans text-white`}>
			<head>
				<EnvScript />

				{env.TRACKING_ID && env.TRACKING_URL && (
					<>
						<Script strategy="afterInteractive" data-site-id={env.TRACKING_ID} src={env.TRACKING_URL} />
					</>
				)}
			</head>

			<body>
				<OledModeProvider>
					<LiveDataProvider>
						<div className="flex flex-col w-full bg-zinc-950 h-screen overflow-hidden relative">
							<TitleBar />
							<div id="electron-content-wrapper" className="flex-1 w-full flex relative min-h-0">
								<div className="flex-shrink-0 relative z-[100] h-full">
									<SidebarWrapper />
								</div>
								<div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
									<GlobalHeader />
									<div className="flex-1 overflow-hidden min-h-0">
										{children}
									</div>
								</div>
							</div>
						</div>
					</LiveDataProvider>
				</OledModeProvider>
			</body>
		</html>
	);
}
