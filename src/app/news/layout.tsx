import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI in Nonprofits News | Nonprofit AI Radar",
  description:
    "AI-curated daily news about how nonprofits are using artificial intelligence. Filter by nonprofit type, geography, relevance, and keyword.",
  openGraph: {
    title: "AI in Nonprofits News",
    description:
      "AI-curated daily news about how nonprofits are using artificial intelligence to enhance their organisations.",
    type: "website",
    siteName: "Nonprofit AI Radar",
  },
  twitter: {
    card: "summary",
    title: "AI in Nonprofits News",
    description:
      "AI-curated daily news about how nonprofits are using artificial intelligence.",
  },
  alternates: {
    canonical: "/news",
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
