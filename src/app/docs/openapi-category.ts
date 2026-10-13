/** The parts of an OpenAPI document that a category's reference keeps or drops */
interface OpenApiDocument {
  paths?: Record<string, unknown>;
  tags?: { name: string }[];
  components?: { schemas?: Record<string, unknown> };
  [key: string]: unknown;
}

const SCHEMA_REF = '#/components/schemas/';

/** Every schema name a value refers to with $ref, at any depth */
const schemaRefs = (value: unknown, found = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) {
    value.forEach(item => schemaRefs(item, found));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === '$ref' && typeof item === 'string' && item.startsWith(SCHEMA_REF)) {
        found.add(item.slice(SCHEMA_REF.length));
      } else {
        schemaRefs(item, found);
      }
    }
  }
  return found;
};

/** Tags the operations of the paths use */
const operationTags = (paths: Record<string, unknown>): Set<string> =>
  new Set(
    Object.values(paths).flatMap(item =>
      Object.values((item ?? {}) as Record<string, { tags?: unknown }>).flatMap(operation =>
        Array.isArray(operation?.tags) ? operation.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      ),
    ),
  );

/**
 * The document with only the paths under `prefix`, the tags they use and the
 * schemas they refer to, directly or through other schemas.
 */
export function openApiForCategory<T extends OpenApiDocument>(document: T, prefix: string): T {
  const paths = Object.fromEntries(
    Object.entries(document.paths ?? {}).filter(([path]) => path === prefix || path.startsWith(prefix + '/')),
  );
  const tags = operationTags(paths);

  const allSchemas = document.components?.schemas ?? {};
  const keep = new Set<string>();
  const pending = [...schemaRefs(paths)];
  while (pending.length) {
    const name = pending.pop() as string;
    if (keep.has(name) || !(name in allSchemas)) continue;
    keep.add(name);
    pending.push(...schemaRefs(allSchemas[name]));
  }
  const schemas = Object.fromEntries(Object.entries(allSchemas).filter(([name]) => keep.has(name)));

  return {
    ...document,
    paths,
    ...(document.tags ? { tags: document.tags.filter(tag => tags.has(tag.name)) } : {}),
    ...(document.components ? { components: { ...document.components, schemas } } : {}),
  };
}
