import { explorerTxUrl, formatTimestamp, truncateMiddle } from "@/lib/format";
import type { SolanaNetwork, TimelineItem } from "@/lib/types";
import CopyButton from "./CopyButton";

type TimelineProps = {
	items: TimelineItem[];
	network?: SolanaNetwork;
};

const statusStyles: Record<TimelineItem["status"], string> = {
	pending: "border-white/20 text-white/40",
	ok: "border-emerald-400/60 text-emerald-300",
	error: "border-rose-400/60 text-rose-300",
};

const Timeline = ({ items, network }: TimelineProps) => {
	return (
		<ol className="relative border-l border-white/10">
			{items.map((item, index) => (
				<li key={item.id} className={index === items.length - 1 ? "ml-6" : "ml-6 pb-6"}>
					<span
						className={`absolute -left-3 mt-1 flex h-6 w-6 items-center justify-center rounded-full border bg-[#151524] ${statusStyles[item.status]}`}
					>
						<span className="text-[10px] font-semibold">{index + 1}</span>
					</span>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-semibold text-white">{item.label}</p>
							<p className="text-xs text-white/50">{formatTimestamp(item.timestamp)}</p>
							{item.note ? <p className="mt-1 text-xs text-white/40">{item.note}</p> : null}
						</div>
						{item.signature ? (
							<div className="flex items-center gap-2">
								<a
									href={explorerTxUrl(item.signature, network)}
									target="_blank"
									rel="noreferrer"
									className="font-mono text-xs text-white/70 hover:text-white"
								>
									{truncateMiddle(item.signature)}
								</a>
								<CopyButton value={item.signature} />
							</div>
						) : (
							<span className="text-xs text-white/40">Awaiting on-chain data</span>
						)}
					</div>
				</li>
			))}
		</ol>
	);
};

export default Timeline;
