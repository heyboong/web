// Import Dependencies
import { RouterProvider } from "react-router";

// Local Imports
import { AuthProvider } from "./app/contexts/auth/Provider";
import { BreakpointProvider } from "./app/contexts/breakpoint/Provider";
import { LocaleProvider } from "./app/contexts/locale/Provider";
import { SettingsProvider } from "./app/contexts/settings/Provider";
import { SidebarProvider } from "./app/contexts/sidebar/Provider";
import { ThemeProvider } from "./app/contexts/theme/Provider";
import MaintenanceGuard from "./components/guards/MaintenanceGuard";
import router from "./app/router/router";

// ----------------------------------------------------------------------

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <MaintenanceGuard>
          <ThemeProvider>
            <LocaleProvider>
              <BreakpointProvider>
                <SidebarProvider>
                  <RouterProvider router={router} />
                </SidebarProvider>
              </BreakpointProvider>
            </LocaleProvider>
          </ThemeProvider>
        </MaintenanceGuard>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;