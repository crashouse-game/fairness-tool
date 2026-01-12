"use client";

import { useEffect, useState } from "react";

export const MEDIA_QUERIES = {
	mobile: "(max-width: 768px)",
	mdUp: "(min-width: 768px)",
} as const;

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const mediaQueryList = window.matchMedia(query);

		const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
			setMatches(event.matches);
		};

		handleChange(mediaQueryList);

		mediaQueryList.addEventListener("change", handleChange);

		return () => {
			mediaQueryList.removeEventListener("change", handleChange);
		};
	}, [query]);

	return matches;
}

export function useIsMobile(): boolean {
	return useMediaQuery(MEDIA_QUERIES.mobile);
}
