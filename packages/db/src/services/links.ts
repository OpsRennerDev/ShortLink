import { randomBytes } from "node:crypto";
import { prisma } from "../client.js";
import { Prisma } from "../../generated/prisma/client.js";
import { LinkNotFoundError, SlugConflictError } from "../errors.js";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";


function generateSlug(length = 7) {
  const bytes = randomBytes(length);
  let slug = "";
  for (const byte of bytes) {
    slug += ALPHABET[byte % ALPHABET.length];
  }
  return slug;
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}


export async function createLink(url: string, customSlug?: string) {
  if (customSlug) {
    try {
      return await prisma.link.create({ data: { url, slug: customSlug } });
    } catch (error) {
      if (isUniqueViolation(error)) throw new SlugConflictError(customSlug);
      throw error;
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.link.create({ data: { url, slug: generateSlug() } });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }

  throw new Error("Não foi possível gerar um slug único, tente novamente");
}



export async function getLinkBySlug(slug: string) {
  return prisma.link.findUnique({ where: { slug } });
}

type ClickMeta = {
  userAgent?: string | null;
  referer?: string | null;
};

export async function registerClick(linkId: string, meta: ClickMeta = {}) {
  await prisma.$transaction([
    prisma.click.create({
      data: {
        linkId,
        userAgent: meta.userAgent,
        referer: meta.referer,
      },
    }),
    prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } },
    }),
  ]);
}


export async function getStats(slug: string, days = 7) {
  const link = await prisma.link.findUnique({ where: { slug } });
  if (!link) throw new LinkNotFoundError(slug);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<{ day: Date; clicks: number }[]>`
    SELECT date_trunc('day', "createdAt") AS day,
           count(*)::int AS clicks
    FROM "Click"
    WHERE "linkId" = ${link.id}
      AND "createdAt" >= ${since}
    GROUP BY 1
    ORDER BY 1
  `;

  return {
    slug: link.slug,
    url: link.url,
    totalClicks: link.clickCount,
    days: rows.map((row) => ({
      date: row.day.toISOString().slice(0, 10),
      clicks: row.clicks,
    })),
  };
}

export async function listLinks({
  cursor,
  limit = 20,
}: { cursor?: string; limit?: number } = {}) {
  const items = await prisma.link.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;

  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}