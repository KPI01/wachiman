import type { Route } from "./+types/home";
import { redirect } from "react-router";

export function loader(_args: Route.LoaderArgs) {
  return redirect("/requester/planned-access");
}

export default function RequesterHome(_props: Route.ComponentProps) {
  return null;
}
