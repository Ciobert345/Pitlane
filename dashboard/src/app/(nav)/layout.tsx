import { type ReactNode } from "react";

import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";

type Props = {
	children: ReactNode;
};

export default function Layout({ children }: Props) {
	return (
		<div className="min-h-screen">
			<NavBar />
			<main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
				{children}
				<Footer />
			</main>
		</div>
	);
}
