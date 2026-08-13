// ============================================================================
// image-upload.ts — otimiza (sharp) e sobe uma imagem ao Supabase Storage
// ============================================================================
// RUNTIME: Node (Server Actions) APENAS — importa `sharp` e a service key via
// @/lib/storage. Extraído da guia Mídia para ser reusado também nas Propostas.
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { uploadImage } from "@/lib/storage";

/**
 * Otimiza a imagem enviada (auto-orient pelo EXIF, maior lado ~1600px sem
 * ampliar, WebP q80) e SOBE ao bucket público "media". Retorna a URL PÚBLICA
 * (persiste em serverless, ao contrário de public/uploads). Lança em falha —
 * o chamador trata.
 */
export async function optimizeAndUploadImage(file: File): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .rotate() // aplica a orientação do EXIF e a remove (fotos de celular)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  return uploadImage(`${randomUUID()}.webp`, outputBuffer, "image/webp");
}
