import { Outlet } from "react-router";
import { ThemeProvider } from "~/components/ui/theme-provider";

export default function PublicLayout() {
  return (
    <ThemeProvider>
      <div className="p-4 sm:p-8 flex flex-col justify-center">
        <Outlet />
      </div>
    </ThemeProvider>
  );
}
