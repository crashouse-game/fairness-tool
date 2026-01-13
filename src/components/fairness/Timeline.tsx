import { explorerTxUrl, formatTimestamp, truncateMiddle } from "@/lib/format";
import type { SolanaNetwork, TimelineItem } from "@/lib/types";
import CopyButton from "./CopyButton";
import LinkButton from "./LinkButton";

type TimelineProps = {
	items: TimelineItem[];
	network?: SolanaNetwork;
};

const statusStyles: Record<TimelineItem["status"], string> = {
	pending: "border-white/20 text-white/40",
	ok: "border-purple text-primary",
	error: "border-rose-400/60 text-rose-300",
};

const Timeline = ({ items, network }: TimelineProps) => {
	return (
		<ol className="relative ml-4 md:ml-0">
			<span
				aria-hidden="true"
				className="border-secondary pointer-events-none absolute top-0 bottom-16 -left-0.5 border-l border-dashed md:bottom-12"
			/>
			<span
				aria-hidden="true"
				className="border-t-secondary pointer-events-none absolute bottom-16 -left-0.5 h-0 w-0 -translate-x-1/2 border-t-[7px] border-r-[5px] border-l-[5px] border-r-transparent border-l-transparent md:bottom-12"
			/>
			{items.map((item, index) => {
				const Icon = item.icon;

				return (
					<li key={item.id} className={index === items.length - 1 ? "ml-12" : "ml-12 pb-4"}>
						<span
							className={`absolute -left-5 flex items-center justify-center rounded-full border bg-[#161223] p-2 ${statusStyles[item.status]}`}
						>
							{Icon ? (
								<Icon className="h-5 w-5" />
							) : (
								<span className="text-[10px] font-semibold">{index + 1}</span>
							)}
						</span>
						<div className="flex w-full -translate-y-1 flex-col sm:flex-row sm:items-center sm:justify-between md:gap-2">
							<div className="text-secondary flex min-h-12 flex-col justify-center text-sm md:min-h-12">
								<p>{item.label}</p>
								{item.timestamp ? <p>{formatTimestamp(item.timestamp)}</p> : null}
								{item.note ? <p className="mt-1 text-xs text-white/40">{item.note}</p> : null}
							</div>
							{item.signature ? (
								<div className="flex w-full items-center justify-between gap-3 md:w-auto">
									<p className="grow font-mono text-xs text-white md:grow-0">
										{truncateMiddle(item.signature)}
									</p>

									<CopyButton value={item.signature} />
									<LinkButton signature={item.signature} network={network} />
								</div>
							) : item.status !== "ok" ? (
								<span className="text-xs text-white/40">Awaiting on-chain data</span>
							) : null}
						</div>
					</li>
				);
			})}
		</ol>
	);
};

export default Timeline;
