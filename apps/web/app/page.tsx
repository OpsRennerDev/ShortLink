"use client";
import {
  shortenLink,
  LinkItem,
  LinkStats,
  fetchLinks,
  fetchStats,
} from "@/lib/api";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedStats, setSelectedStats] = useState<LinkStats | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async function loadLinks() {
    try {
      const data = await fetchLinks();
      setLinks(data.items);
    } catch {}
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await shortenLink(url, customSlug);
      setUrl("");
      setCustomSlug("");
      await loadLinks();
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(slug: string) {
    const fullUrl = `${apiHost}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  async function handleShowStats(slug: string) {
    try{
      const stats = await fetchStats(slug)
      setSelectedStats(stats)
    }catch(err: any){
      alert("Erro ao carregar estatísticas: " + err.message)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            FIAP Live • Prisma 7 + Neon + Next.js
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            ShortLink Pro
          </h1>
          <p className="text-slate-400 text-base">
            Encurtador de URLs em arquitetura Monorepo moderna com PostgreSQL
            Serverless.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                URL de Destino
              </label>
              <input
                type="url"
                required
                placeholder="https://exemplo.com.br/artigo-muito-longo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Slug Personalizado (Opcional)
              </label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-700 overflow-hidden">
                <span className="px-4 py-3 text-slate-500 select-none text-sm border-r border-slate-800">
                  {apiHost}/
                </span>
                <input
                  type="text"
                  placeholder="meu-link"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold transition shadow-lg disabled:opacity-50"
            >
              {loading ? "Encurtando link..." : "Encurtar URL"}
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">
              Links Criados
            </h2>
            <button
              onClick={loadLinks}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Atualizar lista
            </button>
          </div>

          {links.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenhum link encurtado ainda. Crie o primeiro acima!
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <a
                        href={`${apiHost}/${link.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-indigo-400 hover:underline truncate"
                      >
                        /{link.slug}
                      </a>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {link.clickCount} cliques
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {link.url}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(link.slug)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                    >
                      {copiedSlug === link.slug ? "Copiado! ✓" : "Copiar"}
                    </button>
                    <button
                      onClick={() => handleShowStats(link.slug)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition"
                    >
                      Estatísticas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal / Card de Estatísticas */}
        {selectedStats && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100">
                  Estatísticas: /{selectedStats.slug}
                </h3>
                <button
                  onClick={() => setSelectedStats(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-400">Total de Acessos</span>
                <span className="text-2xl font-extrabold text-cyan-400">
                  {selectedStats.totalClicks}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Cliques nos últimos 7 dias
                </h4>
                {selectedStats.days.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Sem acessos recentes.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedStats.days.map((d) => (
                      <div
                        key={d.date}
                        className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-950 border border-slate-800/60"
                      >
                        <span className="text-slate-400">{d.date}</span>
                        <span className="font-semibold text-slate-200">
                          {d.clicks} cliques
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedStats(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
