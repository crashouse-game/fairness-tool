import { NextResponse, type NextRequest } from "next/server";
import { getMockBackendResponses } from "@/mock/backendData";

type RouteParams = {
	params: Promise<{
		roundId: string;
	}>;
};

export async function GET(_: NextRequest, { params }: RouteParams) {
	const { roundId } = await params;
	const match = getMockBackendResponses("mocked").find((game) => game.gameId === roundId);

	if (!match) {
		return NextResponse.json({ error: "Round not found." }, { status: 404 });
	}

	return NextResponse.json(match);
}
