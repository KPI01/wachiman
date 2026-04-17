import { getUsers } from "~/lib/database/user";
import type { Route } from "./+types";

export async function loader() {
  const users = await getUsers();

  return { users };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <div className="max-w-full">
      Aqui va la tabla de los usuarios
      <br />
      <p>{loaderData?.users && JSON.stringify(loaderData.users)}</p>
    </div>
  );
}
