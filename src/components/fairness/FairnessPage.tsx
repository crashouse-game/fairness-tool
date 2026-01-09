"use client";

import { useEffect, useState } from "react";
import { DEFAULT_NETWORK, SOURCE_URL } from "@/lib/config";
import { formatCrashPoint } from "@/lib/format";
import type { TimelineItem } from "@/lib/types";
import { useFairness } from "@/hooks/useFairness";
import {
	getDefaultGameId,
	getGameOptions,
	getRpcLabel,
	shouldShowManualGameInput,
} from "@/services/dataSource";
import Timeline from "./Timeline";

type FairnessPageProps = {
	initialGameId?: string;
};

const FairnessPage = ({ initialGameId = "" }: FairnessPageProps) => {
	const [gameId, setGameId] = useState(initialGameId);
	const gameOptions = getGameOptions();
	const defaultGameId = getDefaultGameId();
	const hasGameOptions = gameOptions.length > 0;
	const rpcLabel = getRpcLabel();
	const showManualGameInput = shouldShowManualGameInput();

	useEffect(() => {
		if (!hasGameOptions) {
			return;
		}

		const trimmed = gameId.trim();
		if (!trimmed && defaultGameId) {
			setGameId(defaultGameId);
		}
	}, [defaultGameId, gameId, hasGameOptions]);

	const { data, error, hasError, isLoading, isReady, verify } = useFairness(gameId, {
		auto: Boolean(initialGameId) || hasGameOptions,
	});

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
			timestamp: data?.transactions.commit?.blockTime ?? null,
			signature: data?.backend.commitTx,
			status: txStatus(data?.transactions.commit),
		},
		{
			id: "betting",
			label: "Betting phase",
			note: "Bets stay open until the blockhash is committed.",
			status: phaseStatus,
		},
		{
			id: "blockhash",
			label: "Block hash committed",
			timestamp: data?.transactions.blockhash?.blockTime ?? null,
			signature: data?.backend.blockhashTx,
			status: txStatus(data?.transactions.blockhash),
		},
		{
			id: "running",
			label: "Game running",
			note: "Crash point locked by the blockhash + secret.",
			status: phaseStatus,
		},
		{
			id: "reveal",
			label: "Game secret revealed",
			timestamp: data?.transactions.reveal?.blockTime ?? null,
			signature: data?.backend.revealTx,
			status: txStatus(data?.transactions.reveal),
		},
	];

	const statusMessage = hasError
		? (error ?? "Unable to verify.")
		: isLoading
			? "Fetching backend + on-chain data..."
			: (data?.result.message ?? "Ready to verify.");

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		verify();
	};

	return (
		<div className="relative min-h-screen overflow-hidden bg-[#0b0b14] text-white">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_-50px,rgba(124,58,237,0.35),transparent_70%)]" />
			<div className="pointer-events-none absolute top-1/2 -left-40 h-96 w-96 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_70%)] blur-2xl" />
			<div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pt-10 pb-20">
				<header className="mb-12 flex items-center justify-between">
					<span className="text-sm font-semibold tracking-[0.3em] text-white/70 uppercase">
						Crashouse
					</span>
					{SOURCE_URL ? (
						<a
							href={SOURCE_URL}
							target="_blank"
							rel="noreferrer"
							className="text-xs font-semibold text-white/60 transition hover:text-white"
						>
							View open source code
						</a>
					) : null}
				</header>

				<main className="flex flex-1 flex-col gap-10">
					<section className="max-w-2xl space-y-4">
						<div className="flex flex-wrap items-center gap-4">
							<h1 className="text-3xl font-semibold tracking-tight">Game Fairness Tool</h1>
							<span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
								{rpcLabel}
							</span>
						</div>
						<p className="text-sm leading-relaxed text-white/60">
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
							<form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
								<input
									type="text"
									value={gameId}
									onChange={(event) => setGameId(event.target.value)}
									placeholder="Game number"
									className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white transition outline-none focus:border-violet-400/70"
								/>
								<button
									type="submit"
									className="h-11 rounded-xl bg-violet-500 px-6 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-white/10"
									disabled={isLoading}
								>
									{isLoading ? "Loading..." : "Load game"}
								</button>
							</form>
						) : null}
					</section>

					<section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-violet-500/10 p-6 shadow-[0_30px_80px_rgba(15,15,25,0.65)] sm:p-10">
						<div className="flex flex-col gap-6">
							<div className="rounded-2xl border border-white/10 bg-[#10101d]/80 p-6">
								<Timeline items={timelineItems} network={network} />
							</div>

							<div className="flex flex-col gap-4">
								<button
									type="button"
									onClick={verify}
									disabled={isLoading || !gameId.trim()}
									className="h-12 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								>
									Verify
								</button>
								<p className="text-xs text-white/60">{statusMessage}</p>
							</div>

							<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 text-sm">
								<div className="flex items-center gap-3 text-white/70">
									<span>Game #</span>
									<span className="rounded-lg bg-white/10 px-3 py-1 text-white">
										{gameId.trim() || "--"}
									</span>
								</div>
								<div className="flex items-center gap-3 text-white/70">
									<span>Crashed at</span>
									<span className="rounded-lg bg-emerald-400/10 px-3 py-1 font-semibold text-emerald-300">
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
