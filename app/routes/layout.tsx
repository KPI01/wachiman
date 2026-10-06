import { Outlet } from "react-router";
import { ThemeProvider } from "~/components/ui/theme-provider";

export default function PublicLayout() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}
