import type { NextConfig } from "next";

const normalizeBasePath = (value?: string) => {
	const trimmed = (value ?? "").trim().replace(/^\/+|\/+$/g, "");
	return trimmed ? `/${trimmed}` : "";
};

const repoName = process.env.GITHUB_REPOSITORY?.split("/")?.[1] ?? "";
const resolvedBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? repoName);
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true" || !!process.env.GITHUB_PAGES;

const nextConfig: NextConfig = {
	...(isStaticExport ? { output: "export", trailingSlash: true } : {}),
	basePath: resolvedBasePath || undefined,
	assetPrefix: resolvedBasePath || undefined,
	images: {
		// Disable image optimization so the static export works on GitHub Pages.
		unoptimized: true,
	},
};

export default nextConfig;
