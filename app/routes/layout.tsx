import { Outlet } from "react-router";
import { ThemeProvider } from "~/components/ui/theme-provider";

export default function PublicLayout() {
  return (
    <ThemeProvider>
      <div className="p-8 w-full h-full grid place-content-center">
        <Outlet />
      </div>
    </ThemeProvider>
  );
}
