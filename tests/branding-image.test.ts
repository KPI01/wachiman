import { describe, expect, it } from "vitest";
import {
  MAX_BRANDING_IMAGE_BYTES,
  validateBrandingImage,
} from "../app/lib/services/branding-image.server";

function imageFile(bytes: Uint8Array, mimeType: string, name = "image") {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new File([copy], name, { type: mimeType });
}

describe("validación de imágenes de branding", () => {
  it("acepta firmas PNG, JPEG y WebP que coinciden con el MIME", async () => {
    const samples = [
      {
        type: "image/png",
        bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      },
      { type: "image/jpeg", bytes: new Uint8Array([0xff, 0xd8, 0xff]) },
      {
        type: "image/webp",
        bytes: new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
      },
    ];

    for (const sample of samples) {
      await expect(validateBrandingImage(imageFile(sample.bytes, sample.type)))
        .resolves.toMatchObject({ mimeType: sample.type });
    }
  });

  it("rechaza un MIME que no coincide con la firma del archivo", async () => {
    const file = imageFile(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/jpeg",
    );

    await expect(validateBrandingImage(file)).resolves.toEqual({
      error: "El contenido del archivo no coincide con el formato seleccionado.",
    });
  });

  it("rechaza imágenes que superan los 512 KiB", async () => {
    const file = imageFile(
      new Uint8Array(MAX_BRANDING_IMAGE_BYTES + 1),
      "image/png",
    );

    await expect(validateBrandingImage(file)).resolves.toEqual({
      error: "Cada imagen debe pesar como máximo 512 KiB.",
    });
  });

  it("conserva SVG estáticos y elimina atributos no permitidos", async () => {
    const file = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="brand"><stop offset="0%" stop-color="#123456"/></linearGradient></defs><path d="M0 0h10v10z" fill="url(#brand)" data-note="decorative"/></svg>'],
      "logo.svg",
      { type: "image/svg+xml" },
    );

    const result = await validateBrandingImage(file);
    expect(result).not.toBeNull();
    expect(result && "data" in result).toBe(true);
    if (result && "data" in result) {
      const sanitized = Buffer.from(result.data, "base64").toString("utf8");
      expect(sanitized).toContain("<svg");
      expect(sanitized).toContain("<linearGradient");
      expect(sanitized).toContain("<path");
      expect(sanitized).toContain("url(#brand)");
      expect(sanitized).not.toContain("data-note");
    }
  });

  it("rechaza SVG con scripts y referencias a recursos externos", async () => {
    const maliciousSvg = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><path onclick="alert(1)"/></svg>'],
      "logo.svg",
      { type: "image/svg+xml" },
    );
    const externalReference = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://example.com/a.svg#x)"/></svg>'],
      "logo.svg",
      { type: "image/svg+xml" },
    );
    const script = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
      "logo.svg",
      { type: "image/svg+xml" },
    );

    await expect(validateBrandingImage(maliciousSvg)).resolves.toMatchObject({ error: expect.any(String) });
    await expect(validateBrandingImage(externalReference)).resolves.toMatchObject({ error: expect.any(String) });
    await expect(validateBrandingImage(script)).resolves.toMatchObject({ error: expect.any(String) });
  });
});
