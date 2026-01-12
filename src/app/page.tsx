import FairnessPage from "@/components/fairness/FairnessPage";

type PageProps = {
	searchParams?:
		| Record<string, string | string[] | undefined>
		| Promise<Record<string, string | string[] | undefined>>;
};

const getParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default async function Home({ searchParams }: PageProps) {
	const resolvedSearchParams = await Promise.resolve(searchParams);
	const gameParam =
		getParam(resolvedSearchParams?.game) ?? getParam(resolvedSearchParams?.gameId) ?? "";

	return <FairnessPage initialGameId={gameParam} />;
}
