import { config as loadEnv } from "dotenv";
import { initDb } from "../../db/server";

loadEnv();

async function main() {
  await initDb();
  const { checkExpiredDocuments } = await import("../../app/lib/services/worker-document.server");
  const result = await checkExpiredDocuments();
  console.log(JSON.stringify({ job: "expire-documents", ...result }));
}

main().catch((error) => {
  console.error("Error al ejecutar el job de expiración documental:", error);
  process.exitCode = 1;
});
