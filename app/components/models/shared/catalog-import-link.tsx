import { Link } from "react-router";
import { FileUp } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function CatalogImportLink({ type }: { type: "companies" | "workers" | "workCategories" | "allowedAreas" }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={`/admin/data-import?type=${type}`}><FileUp /> Importar desde archivo</Link>
    </Button>
  );
}
