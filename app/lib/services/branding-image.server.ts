import sanitizeHtml from "sanitize-html";

export const MAX_BRANDING_IMAGE_BYTES = 512 * 1024;

export type BrandingAsset = "logo" | "favicon";
export type BrandingImage = {
  data: string;
  mimeType: string;
};

const MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const SVG_ALLOWED_TAGS = [
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "title",
  "desc",
];

const SVG_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  "*": [
    "id",
    "fill",
    "fill-rule",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-opacity",
    "opacity",
    "transform",
    "vector-effect",
  ],
  svg: ["xmlns", "width", "height", "viewBox", "preserveAspectRatio", "role", "aria-label"],
  path: ["d"],
  rect: ["x", "y", "width", "height", "rx", "ry"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
  polyline: ["points"],
  polygon: ["points"],
  linearGradient: ["x1", "y1", "x2", "y2", "gradientUnits", "gradientTransform", "spreadMethod"],
  radialGradient: ["cx", "cy", "r", "fx", "fy", "gradientUnits", "gradientTransform", "spreadMethod"],
  stop: ["offset", "stop-color", "stop-opacity"],
  clipPath: ["clipPathUnits"],
  mask: ["x", "y", "width", "height", "maskUnits", "maskContentUnits"],
};

const SVG_SANITIZER_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: SVG_ALLOWED_TAGS,
  allowedAttributes: SVG_ALLOWED_ATTRIBUTES,
  disallowedTagsMode: "discard",
  parser: {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  },
  transformTags: {
    "*": (_tagName, attributes) => ({
      tagName: _tagName,
      attribs: Object.fromEntries(
        Object.entries(attributes).filter(([name, value]) => {
          if (!["fill", "stroke"].includes(name.toLowerCase())) return true;
          return !/url\(\s*["']?(?!#)/i.test(value);
        }),
      ),
    }),
  },
};

function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

function isValidRasterSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/png") {
    return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === "image/jpeg") {
    return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  }
  if (mimeType === "image/webp") {
    return (
      hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

function sanitizeSvg(source: string): string | null {
  if (
    /<!DOCTYPE|<!ENTITY|<\s*(script|foreignObject|iframe|object|embed|image|use|animate|set|audio|video)\b|<\s*style\b|\bon[a-z0-9_-]+\s*=|javascript\s*:|(?:xlink:)?href\s*=/i.test(source) ||
    /url\(\s*["']?(?!#)/i.test(source)
  ) {
    return null;
  }

  const sanitized = sanitizeHtml(source, SVG_SANITIZER_OPTIONS).trim();
  return /^<svg\b/i.test(sanitized) ? sanitized : null;
}

export async function validateBrandingImage(
  file: File | null | undefined,
): Promise<BrandingImage | { error: string } | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BRANDING_IMAGE_BYTES) {
    return { error: "Cada imagen debe pesar como máximo 512 KiB." };
  }
  if (!MIME_TYPES.has(file.type)) {
    return { error: "El formato debe ser PNG, JPEG, WebP o SVG." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type === "image/svg+xml") {
    let source: string;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return { error: "El archivo SVG no tiene una codificación UTF-8 válida." };
    }
    const sanitized = sanitizeSvg(source);
    if (!sanitized) {
      return { error: "El SVG contiene elementos no permitidos o no es válido." };
    }
    return {
      data: Buffer.from(sanitized, "utf8").toString("base64"),
      mimeType: "image/svg+xml",
    };
  }

  if (!isValidRasterSignature(file.type, bytes)) {
    return { error: "El contenido del archivo no coincide con el formato seleccionado." };
  }

  return {
    data: Buffer.from(bytes).toString("base64"),
    mimeType: file.type,
  };
}
