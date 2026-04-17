import { Link } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { buttonVariants } from "~/components/ui/button";

export default function Unauthorized() {
  return (
    <CardContainer
      className="min-w-lg"
      title="Acceso no autorizado"
      description="No tienes permisos para acceder a esta sección."
    >
      <div className="flex justify-center">
        <Link to="/" className={buttonVariants({ variant: "default" })}>
          Volver al inicio
        </Link>
      </div>
    </CardContainer>
  );
}
