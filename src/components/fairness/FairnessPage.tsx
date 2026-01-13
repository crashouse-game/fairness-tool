"use client";

import { useEffect, useRef, useState } from "react";
import { Blocks, Check, Dices, FileCheck, FileLock, Gamepad2 } from "lucide-react";
import { DEFAULT_NETWORK, SOURCE_URL } from "@/lib/config";
import { formatCrashPoint } from "@/lib/format";
import type { TimelineItem } from "@/lib/types";
import { useFairness } from "@/hooks/useFairness";
import { useIsMobile } from "@/hooks/use-media-match";
import {
	getDefaultGameId,
	getGameOptions,
	getRpcLabel,
	shouldShowManualGameInput,
} from "@/services/dataSource";
import Timeline from "./Timeline";
import { Button } from "./button";

type FairnessPageProps = {
	initialGameId?: string;
};

const FairnessPage = ({ initialGameId = "" }: FairnessPageProps) => {
	const gameOptions = getGameOptions();
	const defaultGameId = getDefaultGameId();
	const hasGameOptions = gameOptions.length > 0;
	const resolvedInitialGameId = initialGameId.trim() || (hasGameOptions ? defaultGameId : "");
	const [gameId, setGameId] = useState(resolvedInitialGameId);
	const autoVerifyGameId = useRef(resolvedInitialGameId || null);
	const didAutoVerify = useRef(false);
	const rpcLabel = getRpcLabel();
	const showManualGameInput = shouldShowManualGameInput();
	const isMobile = useIsMobile();

	const { data, error, hasError, isLoading, isReady, verify } = useFairness(gameId);

	useEffect(() => {
		if (didAutoVerify.current) {
			return;
		}

		const trimmed = gameId.trim();
		if (!trimmed || autoVerifyGameId.current !== trimmed) {
			return;
		}

		didAutoVerify.current = true;
		verify();
	}, [gameId, verify]);

	const network = data?.backend.network ?? DEFAULT_NETWORK;
	const crashPoint = formatCrashPoint(data?.result.crashPoint ?? null);

	const phaseStatus = hasError ? "error" : isReady ? "ok" : "pending";
	const txStatus = (tx: { err?: unknown } | null | undefined) => {
		if (hasError) {
			return "error";
		}

		if (!tx) {
			return isReady ? "error" : "pending";
		}

		return tx.err ? "error" : "ok";
	};
	const timelineItems: TimelineItem[] = [
		{
			id: "commit",
			label: "Game secret committed",
			icon: FileLock,
			timestamp: data?.transactions.commit?.blockTime ?? null,
			signature: data?.backend.commitTx,
			status: txStatus(data?.transactions.commit),
		},
		{
			id: "betting",
			label: "Betting phase...",
			icon: Dices,
			status: phaseStatus,
		},
		{
			id: "blockhash",
			label: "Block hash committed",
			icon: Blocks,
			timestamp: data?.transactions.blockhash?.blockTime ?? null,
			signature: data?.backend.blockhashTx,
			status: txStatus(data?.transactions.blockhash),
		},
		{
			id: "running",
			label: "Game running...",
			icon: Gamepad2,
			status: phaseStatus,
		},
		{
			id: "reveal",
			label: "Game secret revealed",
			icon: FileCheck,
			timestamp: data?.transactions.reveal?.blockTime ?? null,
			signature: data?.backend.revealTx,
			status: txStatus(data?.transactions.reveal),
		},
	];

	const statusMessage = hasError ? (error ?? "Unable to verify.") : null;

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		verify();
	};

	const isVerified = data?.result.verified && data.backend.gameId === gameId;

	return (
		<div className="text-color-text-secondary relative min-h-screen w-full overflow-hidden px-4 pt-4 md:px-8">
			<span className="text-primary text:lg font-bold md:text-2xl">Crashouse</span>
			<div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col pt-10 pb-20 md:px-6">
				<main className="flex flex-1 flex-col gap-6">
					<section className="max-w-2xl space-y-4">
						<div className="flex flex-col flex-wrap items-baseline gap-4 md:flex-row">
							<h1 className="text-xl tracking-wide">Game Fairness Tool</h1>
							{SOURCE_URL ? (
								<a
									href={SOURCE_URL}
									target="_blank"
									rel="noreferrer"
									className="text-purple hover:text-purple/70 text-xs tracking-wide transition"
								>
									View open source code
								</a>
							) : null}
						</div>
						<p className="text-secondary inline-flex w-fit rounded-full border border-white/10 px-3 py-1 text-xs whitespace-nowrap">
							{rpcLabel}
						</p>
						<p className="text-primary text-sm">
							Provide a game number and the tool will fetch the commit, blockhash, and reveal
							transactions. Everything is recomputed on the client so players can audit the fairness
							flow.
						</p>
						{hasGameOptions ? (
							<div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-white/70">
								<span>Quick picks</span>
								<select
									value={gameId}
									onChange={(event) => setGameId(event.target.value)}
									className="h-11 rounded-xl border border-white/10 bg-[#0f0f1a] px-4 text-sm text-white/80 transition outline-none focus:border-violet-400/70"
								>
									{gameOptions.map((option) => (
										<option key={option.id} value={option.id}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						) : null}
						{showManualGameInput ? (
							<form onSubmit={handleSubmit} className="flex flex-row items-baseline gap-3">
								<p className="text-sm">Enter the game&apos;s id to verify</p>
								<input
									type="text"
									value={gameId}
									onChange={(event) => setGameId(event.target.value.replace(/\D+/g, ""))}
									placeholder="Game number"
									inputMode="numeric"
									pattern="[0-9]*"
									className="w-30 rounded-md border border-white/10 bg-white/5 px-4 py-1 text-center text-sm text-white transition outline-none focus:border-violet-400/70"
								/>
							</form>
						) : null}
					</section>

					<section
						className={`${isMobile ? "bg-copper-gradient-mobile" : "bg-copper-gradient"} rounded-3xl py-6 shadow-[0_30px_80px_rgba(15,15,25,0.65)] sm:px-20`}
					>
						<div className="flex flex-col gap-2">
							<div className="rounded-2xl p-6">
								<Timeline items={timelineItems} network={network} />
							</div>

							<div className="flex flex-col gap-4 px-4 md:px-0">
								<Button
									className="h-10 w-full"
									onClick={verify}
									isLoading={isLoading}
									disabled={isLoading || !gameId.trim() || isVerified}
								>
									{isVerified ? (
										<p className="flex gap-2">
											Verified <Check />
										</p>
									) : (
										"Verify"
									)}
								</Button>
								<p className="text-xs text-white/60">{statusMessage}</p>
							</div>

							<div className="text-primary flex flex-col flex-wrap items-center justify-center gap-6 rounded-2xl px-6 text-xl md:flex-row">
								<div className="flex items-center gap-2">
									<span>Game #</span>
									<span className="rounded-lg bg-white/5 px-3 py-1">
										{data?.backend.gameId.trim() || "--"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span>Crashed at</span>
									<span className="text-green rounded-lg bg-white/5 px-3 py-1 font-semibold">
										{crashPoint}
									</span>
								</div>
							</div>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
};

export default FairnessPage;
