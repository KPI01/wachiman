import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { areFileUploadsSupported } from "~/lib/platform.server";
import { toOsPath } from "~/lib/services/worker-document.server";
import { WorkerDocumentEntity } from "~/lib/database/worker-document.server";

export async function loader({
  params,
}: {
  request: Request;
  params: { workerId: string; docId: string };
}) {
  const document = await WorkerDocumentEntity.findById(params.docId);

  if (!document) {
    return new Response("Not found", { status: 404 });
  }

  if (!areFileUploadsSupported()) {
    return Response.json({ error: "Descarga de documentos no disponible en este entorno." }, { status: 503 });
  }

  const fullPath = toOsPath(document.filePath);

  try {
    const fileStat = await stat(fullPath);

    const stream = createReadStream(fullPath);
    const body = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: string | Buffer) => {
          if (typeof chunk === "string") {
            controller.enqueue(new TextEncoder().encode(chunk));
          } else {
            controller.enqueue(new Uint8Array(chunk));
          }
        });
        stream.on("end", () => {
          controller.close();
        });
        stream.on("error", (err: Error) => {
          controller.error(err);
        });
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("File not found on disk", { status: 404 });
  }
}
