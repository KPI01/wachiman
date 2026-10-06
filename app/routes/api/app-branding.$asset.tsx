import { getPublicBrandingAsset } from "~/lib/services/app-settings.server";

export async function loader({ params }: { params: { asset?: string } }) {
  if (params.asset !== "logo" && params.asset !== "favicon") {
    return new Response("No encontrado", { status: 404 });
  }

  const asset = await getPublicBrandingAsset(params.asset);
  if (!asset) return new Response("No encontrado", { status: 404 });

  return new Response(asset.bytes, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="app-${params.asset}"`,
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
