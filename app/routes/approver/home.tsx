import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "ACCESS_APPROVER");
}

export default function ApproverHome() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/approver/planned-access", { replace: true });
  }, [navigate]);

  return null;
}
