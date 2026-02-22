"use client";

import SegmentedControls from "@/components/ui/SegmentedControls";
import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import Input from "@/components/ui/Input";

import FavoriteDrivers from "@/components/settings/FavoriteDrivers";

import DelayInput from "@/components/DelayInput";
import DelayTimer from "@/components/DelayTimer";
import Toggle from "@/components/ui/Toggle";

import { useSettingsStore } from "@/stores/useSettingsStore";
import Footer from "@/components/Footer";

const sectionTitleClass =
	"text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent";

export default function SettingsPage() {
	const settings = useSettingsStore();
	return (
		<div className="mx-auto max-w-4xl space-y-8 pb-10">
			<header>
				<h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Impostazioni</h1>
				<p className="mt-1 text-sm text-zinc-500">
					Personalizza la dashboard e il comportamento del live timing.
				</p>
			</header>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Visuale */}
				<section className="glass-card rounded-2xl p-5 md:p-6">
					<h2 className={sectionTitleClass}>Visuale</h2>
					<div className="mt-4 space-y-4">
						<SettingRow label="Metriche vettura (RPM, marcia, velocità)" enabled={settings.carMetrics} onToggle={settings.setCarMetrics} />
						<SettingRow label="Numeri curva sulla mappa" enabled={settings.showCornerNumbers} onToggle={settings.setShowCornerNumbers} />
						<SettingRow label="Intestazione tabella piloti" enabled={settings.tableHeaders} onToggle={settings.setTableHeaders} />
						<SettingRow label="Migliori settori" enabled={settings.showBestSectors} onToggle={settings.setShowBestSectors} />
						<SettingRow label="Mini-settori" enabled={settings.showMiniSectors} onToggle={settings.setShowMiniSectors} />
						<SettingRow label="Modalità OLED (sfondo nero)" enabled={settings.oledMode} onToggle={settings.setOledMode} />
						<SettingRow label="Colori safety car" enabled={settings.useSafetyCarColors} onToggle={settings.setUseSafetyCarColors} />
					</div>
				</section>

				{/* Race Control */}
				<section className="glass-card rounded-2xl p-5 md:p-6">
					<h2 className={sectionTitleClass}>Race Control</h2>
					<div className="mt-4 space-y-4">
						<SettingRow label="Suono su nuovo messaggio" enabled={settings.raceControlChime} onToggle={settings.setRaceControlChime} />
						{settings.raceControlChime && (
							<div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
								<Input
									value={String(settings.raceControlChimeVolume)}
									setValue={(v) => {
										const n = Number(v);
										if (!isNaN(n)) settings.setRaceControlChimeVolume(n);
									}}
								/>
								<Slider className="!w-44" value={settings.raceControlChimeVolume} setValue={settings.setRaceControlChimeVolume} />
								<span className="text-xs text-zinc-500">Volume</span>
							</div>
						)}
					</div>
				</section>

				{/* Pilot preferiti - larghezza piena */}
				<section className="glass-card rounded-2xl p-5 lg:col-span-2 md:p-6">
					<h2 className={sectionTitleClass}>Piloti preferiti</h2>
					<p className="mt-1 text-sm text-zinc-500">Evidenziati in dashboard e classifiche.</p>
					<div className="mt-4">
						<FavoriteDrivers />
					</div>
				</section>

				{/* Unità e delay */}
				<section className="glass-card rounded-2xl p-5 md:p-6">
					<h2 className={sectionTitleClass}>Unità di misura</h2>
					<p className="mt-1 text-sm text-zinc-500">Unità per la velocità.</p>
					<div className="mt-4">
						<SegmentedControls
							id="speed-unit"
							selected={settings.speedUnit}
							onSelect={settings.setSpeedUnit}
							options={[
								{ label: "km/h", value: "metric" },
								{ label: "mph", value: "imperial" },
							]}
						/>
					</div>
				</section>

				<section className="glass-card rounded-2xl p-5 md:p-6">
					<h2 className={sectionTitleClass}>Ritardo dati</h2>
					<p className="mt-1 text-sm text-zinc-500">Ritardo in secondi rispetto al live (impostabile anche dalla barra in alto).</p>
					<div className="mt-4 flex flex-wrap items-center gap-3">
						<DelayTimer />
						<DelayInput />
						<span className="text-xs text-zinc-500">secondi</span>
					</div>
					<Button
						className="mt-4 rounded-xl border border-f1-neon/30 bg-f1-neon/10 px-4 py-2 text-sm font-medium text-white hover:bg-f1-neon/20"
						onClick={() => settings.setDelay(0)}
					>
						Azzera ritardo
					</Button>
				</section>

				{/* Sviluppo */}
				<section className="glass-card rounded-2xl p-5 lg:col-span-2 md:p-6">
					<h2 className={sectionTitleClass}>Sviluppo</h2>
					<div className="mt-4">
						<SettingRow label="Simulatore (localhost:4005)" enabled={settings.useSimulator} onToggle={settings.setUseSimulator} />
					</div>
				</section>
			</div>

			<Footer />
		</div>
	);
}

function SettingRow({
	label,
	enabled,
	onToggle,
}: {
	label: string;
	enabled: boolean;
	onToggle: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center gap-3">
			<Toggle enabled={enabled} setEnabled={onToggle} />
			<span className="text-sm text-zinc-400">{label}</span>
		</div>
	);
}
