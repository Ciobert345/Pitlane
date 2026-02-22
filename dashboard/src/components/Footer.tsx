import Link from "next/link";

export default function Footer() {
	return (
		<footer className="mt-12 border-t border-white/5 pt-8 text-sm text-zinc-500">
			<div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
				<p>
					Made by <TextLink website="https://github.com/robertciobanu">Robert Ciobanu</TextLink>.
				</p>

				<p>
					Pitlane · Based on <TextLink website="https://github.com/slowlydev/f1-dash">F1 Dash</TextLink> by{" "}
					<TextLink website="https://slowly.dev">slowlydev</TextLink>.
				</p>
			</div>

			<p>
				This project/website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA
				ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trademarks of Formula One
				Licensing B.V.
			</p>
		</footer>
	);
}

type TextLinkProps = {
	website: string;
	children: string;
};

const TextLink = ({ website, children }: TextLinkProps) => {
	return (
		<a className="text-zinc-400 hover:text-white transition-colors" target="_blank" href={website}>
			{children}
		</a>
	);
};
