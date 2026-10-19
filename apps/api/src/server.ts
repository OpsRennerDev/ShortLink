import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import {
  createLink,
  getLinkBySlug,
  registerClick,
  getStats,
  listLinks,
  SlugConflictError,
  LinkNotFoundError,
} from "@shortlink/db";
import {
  createLinkSchema,
  listLinksQuerySchema,
  statsQuerySchema,
} from "@shortlink/shared";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// HealthCheck
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// POST: Create Link
app.post("/api/links", async (req, res, next) => {
  try {
    const parsed = createLinkSchema.parse(req.body);
    const link = await createLink(parsed.url, parsed.customSlug);
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

// GET: List Links
app.get("/api/links", async (req, res, next) => {
  try {
    const query = listLinksQuerySchema.parse(req.query);
    const allLinks = await listLinks(query);
    res.json(allLinks);
  } catch (err) {
    next(err);
  }
});

// GET: Get Stats
app.get("/api/links/:slug/stats", async (req, res, next) => {
  try {
    const query = statsQuerySchema.parse(req.query);
    const stats = await getStats(req.params.slug, query.days);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET: Redirect url
app.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const link = await getLinkBySlug(slug);

    if (!link) {
      return res.status(404).send("Link não encontrado ou expirado");
    }

    registerClick(link.id, {
      userAgent: req.headers["user-agent"] ?? undefined,
      referer: req.headers["referer"] ?? undefined,
    }).catch((err) => {
      console.log("Falha ao registrar métrica de clique", err);
    });

    res.redirect(302, link.url);
  } catch (err) {
    next(err);
  }
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Dados Inválidos",
        details: err.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensagem: issue.message,
        })),
      });
    }

    if (err instanceof SlugConflictError) {
      return res.status(409).json({ error: err.message });
    }

    if (err instanceof LinkNotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    console.log("Erro interno do servidor", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  },
);

if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT) || 3001
    app.listen(PORT, () => {
        console.log(`API Rodando: http://localhost:${PORT}`)
    })
}

export default app