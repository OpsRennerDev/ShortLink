const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface LinkItem {
  id: string;
  slug: string;
  url: string;
  clickCount: number;
  createdAt: string;
}

export interface LinkStats {
  slug: string;
  url: string;
  totalClicks: number;
  days: {
    date: string;
    clicks: number;
  }[];
}

export async function fetchLinks(): Promise<{ items: LinkItem[] }> {
  const res = await fetch(`${API_URL}/api/links`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar links");
  return res.json();
}

export async function shortenLink(
  url: string,
  customSlug?: string,
): Promise<LinkItem> {
  const res = await fetch(`${API_URL}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, customSlug: customSlug || undefined }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Erro ao encurtar link");
  }

  return data;
}

export async function fetchStats(slug: string): Promise<LinkStats> {
  const res = await fetch(`${API_URL}/api/links/${slug}/stats?days=7`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Falha ao carregar estatisticas");
  }
  return res.json();
}
