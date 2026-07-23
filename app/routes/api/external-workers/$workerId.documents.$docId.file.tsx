import { validateUserRole } from "~/lib/auth.server";
import { areFileUploadsSupported } from "~/lib/platform.server";
import { getDocumentByWorkerId, toOsPath } from "~/lib/services/worker-document.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { workerId: string; docId: string };
}) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const document = await getDocumentByWorkerId(params.docId, params.workerId);

  if (!document) {
    return new Response("Not found", { status: 404 });
  }

  if (!areFileUploadsSupported()) {
    return Response.json({ error: "Descarga de documentos no disponible en este entorno." }, { status: 503 });
  }

  const { createReadStream } = await import("fs");
  const { stat } = await import("fs/promises");

  const fullPath = await toOsPath(document.filePath);

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
