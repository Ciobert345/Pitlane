"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";

type Props = {
	children: ReactNode;
};

export default function Layout({ children }: Props) {
	const pathname = usePathname();

	// Pages that need full viewport height without the centered max-width container
	const isFullScreen = pathname?.startsWith("/live");

	if (isFullScreen) {
		return (
			<div className="h-full w-full overflow-hidden">
				{children}
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			<main className="mx-auto max-w-[1400px] px-3 py-4 md:px-6 md:py-8 min-h-screen">
				{children}
				<Footer />
			</main>
		</div>
	);
}
