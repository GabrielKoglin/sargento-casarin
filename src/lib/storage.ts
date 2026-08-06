// ============================================================================
// storage.ts — upload/exclusão de imagens no Supabase Storage (bucket "media")
// ============================================================================
// RUNTIME: Node (Server Actions) APENAS. Usa a Storage REST API via `fetch`
// (sem SDK — mesmo estilo do /api/chat) com a SERVICE ROLE key, que bypassa
// RLS/policies. NUNCA importe isto em código client nem exponha a chave.
//
// Requer no ambiente:
//   SUPABASE_URL               ex.: https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  Settings → API → service_role (secreto)
//
// Por que isto existe: em serverless (Vercel) o filesystem é read-only/efêmero,
// então gravar em public/uploads não persiste. As fotos vão para um bucket
// PÚBLICO e guardamos a URL pública em Media.src.

const BUCKET = "media";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

function config(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados (upload de mídia).",
    );
  }
  return { url: url.replace(/\/+$/, ""), key };
}

/** É uma URL pública do NOSSO bucket de storage? */
export function isStorageUrl(src: string): boolean {
  return src.includes(PUBLIC_MARKER);
}

/**
 * Sobe um buffer de imagem ao bucket e retorna a URL PÚBLICA.
 * `objectPath` ex.: "9f3c…-abcd.webp". Lança em falha (o chamador trata).
 */
export async function uploadImage(
  objectPath: string,
  body: Buffer,
  contentType = "image/webp",
): Promise<string> {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-upsert": "true",
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Falha no upload ao storage (${res.status}): ${detail}`);
  }
  return `${url}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

/**
 * Apaga um objeto a partir da sua URL pública. No-op (não lança) se a URL não
 * for do nosso bucket ou se a exclusão falhar — remover a linha do banco é o que
 * importa; um objeto órfão no storage não é fatal.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  if (!isStorageUrl(publicUrl)) return;
  let cfg: { url: string; key: string };
  try {
    cfg = config();
  } catch {
    return;
  }
  const objectPath = publicUrl.slice(
    publicUrl.indexOf(PUBLIC_MARKER) + PUBLIC_MARKER.length,
  );
  if (!objectPath) return;
  await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key },
  }).catch(() => {});
}
