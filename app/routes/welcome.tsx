import { Link } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { Button, buttonVariants } from "~/components/ui/button";

export default function Welcome() {
  return (
    <CardContainer
      className="min-w-lg"
      title="Bienvenido a Industrial Wachiman"
      description="Software para el control de accesos de una fábrica"
    >
      <div className="flex gap-3">
        <Link to="/login" className={buttonVariants({ variant: "default" })}>
          Ir al login
        </Link>
        <Link to="/register" className={buttonVariants({ variant: "outline" })}>
          Ir al registro
        </Link>
      </div>
    </CardContainer>
  );
}
