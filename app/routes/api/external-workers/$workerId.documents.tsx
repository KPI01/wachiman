import { validateUserRole } from "~/lib/auth.server";
import {
  getWorkerDocuments,
  uploadWorkerDocument,
} from "~/lib/services/worker-document.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { workerId: string };
}) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const documents = await getWorkerDocuments(params.workerId);
  return Response.json(documents);
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { workerId: string };
}) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);

  const method = request.method.toUpperCase();
  if (method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  const data: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key !== "file") {
      data[key] = String(value);
    }
  }

  const result = await uploadWorkerDocument(params.workerId, file, data, user.id);
  if (!result.success) {
    return Response.json({ errors: result.errors }, { status: 400 });
  }

  return Response.json(result);
}
