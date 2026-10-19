export class SlugConflictError extends Error {
  slug: string;

  constructor(slug: string) {
    super(`O slug "${slug}" já está em uso`);
    this.name = "SlugConflictError";
    this.slug = slug;
  }
}

export class LinkNotFoundError extends Error {
  slug: string;

  constructor(slug: string) {
    super(`Link "${slug}" não encontrado`);
    this.name = "LinkNotFoundError";
    this.slug = slug;
  }
}