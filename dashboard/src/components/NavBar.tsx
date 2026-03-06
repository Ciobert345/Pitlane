"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import githubIcon from "public/icons/github.svg";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
	const pathname = usePathname();
	const isActive =
		href === "/"
			? pathname === "/"
			: pathname.startsWith(href);

	return (
		<Link
			className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-95 ${isActive
				? "bg-f1-neon/10 text-white shadow-[0_0_12px_rgba(225,6,0,0.15)]"
				: "text-zinc-400 hover:bg-white/5 hover:text-white"
				}`}
			href={href}
		>
			{children}
		</Link>
	);
}

export default function NavBar() {
	return (
		<nav className="sticky top-0 z-[49] w-full border-b border-white/5 bg-zinc-950/80 shadow-lg backdrop-blur-xl">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:h-16 md:px-6">
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-f1-neon/40 to-transparent" />
				<div className="flex flex-1 items-center gap-1">
					<NavLink href="/">Home</NavLink>
					<NavLink href="/dashboard">Dashboard</NavLink>
					<NavLink href="/schedule">Schedule</NavLink>
					<NavLink href="/dashboard/settings">Settings</NavLink>
				</div>
				<div className="flex items-center gap-2">
					<Link
						className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
						href="https://github.com/Ciobert345/Pitlane"
						title="Pitlane su GitHub"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Image src={githubIcon} alt="GitHub" width={18} height={18} />
						<span className="hidden sm:inline">GitHub</span>
					</Link>
				</div>
			</div>
		</nav>
	);
}
