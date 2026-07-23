import { validateUserRole } from "~/lib/auth.server";
import {
  getDocumentByWorkerId,
  updateWorkerDocument,
  deleteWorkerDocument,
} from "~/lib/services/worker-document.server";

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
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(document);
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { workerId: string; docId: string };
}) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);

  const method = request.method.toUpperCase();
  const document = await getDocumentByWorkerId(params.docId, params.workerId);

  if (!document) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (method === "PATCH" || method === "PUT") {
    const formData = await request.formData();
    const data = Object.fromEntries(formData) as Record<string, string>;
    data.id = params.docId;

    const result = await updateWorkerDocument(params.docId, data, user.id);
    if (!result.success) {
      return Response.json({ errors: result.errors }, { status: 400 });
    }

    return Response.json(result);
  }

  if (method === "DELETE") {
    const result = await deleteWorkerDocument(params.docId, user.id);
    if (!result.success) {
      return Response.json({ errors: result.errors }, { status: 400 });
    }

    return Response.json(result);
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
