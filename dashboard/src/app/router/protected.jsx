// Import Dependencies
import { Navigate } from "react-router";

// Local Imports
import { AppLayout } from "app/layouts/AppLayout";
import { DynamicLayout } from "app/layouts/DynamicLayout";
import AuthGuard from "middleware/AuthGuard";

// ----------------------------------------------------------------------

const protectedRoutes = {
  id: "protected",
  Component: AuthGuard,
  children: [
    // The dynamic layout supports both the main layout and the sideblock.
    {
      path: "/",
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboards" />,
        },
        {
          path: "dashboards",
          children: [
            {
              index: true,
              element: <Navigate to="/dashboards/home" />,
            },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("app/pages/dashboards/home")).default,
              }),
            },
          ],
        },
        {
          path: "tools/id-card-generator",
          lazy: async () => ({
            Component: (await import("app/pages/tools/id-card-generator")).default,
          }),
        },
        {
          path: "tools/2fa-generator",
          lazy: async () => ({
            Component: (await import("app/pages/tools/2fa-generator")).default,
          }),
        },
        {
          path: "tools/random-anh-the",
          lazy: async () => ({
            Component: (await import("app/pages/tools/random-anh-the")).default,
          }),
        },
        {
          path: "tool/strong-password-generator",
          lazy: async () => ({
            Component: (await import("app/pages/tool/strong-password-generator")).default,
          }),
        },
        {
          path: "tools/change-pass",
          lazy: async () => ({
            Component: (await import("app/pages/tool/change-pass")).default,
          }),
        },
        {
          path: "phishing",
          children: [
            {
              index: true,
              element: <Navigate to="/phishing/dashboard" />,
            },
            {
              path: "dashboard",
              lazy: async () => ({
                Component: (await import("app/pages/phishing/dashboard")).default,
              }),
            },
            {
              path: "create",
              lazy: async () => ({
                Component: (await import("app/pages/phishing/create")).default,
              }),
            },
            {
              path: "manage",
              lazy: async () => ({
                Component: (await import("app/pages/phishing/manage")).default,
              }),
            },
            {
              path: "accounts",
              lazy: async () => ({
                Component: (await import("app/pages/phishing/accounts")).default,
              }),
            },
            {
              path: "telegram",
              lazy: async () => ({
                Component: (await import("app/pages/phishing/telegram")).default,
              }),
            },
            {
              path: "edit/:id",
              lazy: async () => ({
                Component: (await import("app/pages/phishing/edit")).default,
              }),
            },
            {
              path: ":slug",
              lazy: async () => ({
                Component: (await import("app/pages/phishing/view")).default,
              }),
            },
          ],
        },
        {
          path: "admin",
          children: [
            {
              index: true,
              element: <Navigate to="/admin/settings" />,
            },
            {
              path: "settings",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const SettingsPage = (await import("app/pages/admin/settings")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <SettingsPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "users",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const UsersPage = (await import("app/pages/admin/users")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <UsersPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "analytics",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const AnalyticsPage = (await import("app/pages/admin/analytics")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <AnalyticsPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "activity",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const ActivityPage = (await import("app/pages/admin/activity")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <ActivityPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "user-analytics",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const UserAnalyticsPage = (await import("app/pages/admin/user-analytics")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <UserAnalyticsPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "phishing/templates",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const TemplatesPage = (await import("app/pages/admin/phishing/templates")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <TemplatesPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "phishing/domains",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const DomainsPage = (await import("app/pages/admin/phishing/domains")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <DomainsPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "template-maker",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const TemplateMakerPage = (await import("app/pages/admin/template-maker")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <TemplateMakerPage />
                    </AdminGuard>
                  ),
                };
              },
            },
            {
              path: "template-approval",
              lazy: async () => {
                const AdminGuard = (await import("components/guards/AdminGuard")).default;
                const TemplateApprovalPage = (await import("app/pages/admin/template-approval")).default;
                return {
                  Component: () => (
                    <AdminGuard>
                      <TemplateApprovalPage />
                    </AdminGuard>
                  ),
                };
              },
            },
          ],
        },
        {
          path: "template-maker",
          lazy: async () => ({
            Component: (await import("app/pages/template-maker")).default,
          }),
        },
        {
          path: "template-maker/edit/:id",
          lazy: async () => ({
            Component: (await import("app/pages/template-maker")).default,
          }),
        },
        {
          path: "template-images",
          lazy: async () => ({
            Component: (await import("app/pages/template-images")).default,
          }),
        },
        {
          path: "templates",
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (await import("app/pages/templates")).default,
              }),
            },
            {
              path: "fields/:templateId",
              lazy: async () => ({
                Component: (await import("app/pages/templates/fields")).default,
              }),
            },
          ],
        },
      ],
    },
    // The app layout supports only the main layout. Avoid using it for other layouts.
    {
      Component: AppLayout,
      children: [
        {
          path: "settings",
          lazy: async () => ({
            Component: (await import("app/pages/settings/Layout")).default,
          }),
          children: [
            {
              index: true,
              element: <Navigate to="/settings/general" />,
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (await import("app/pages/settings/sections/General"))
                  .default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (
                  await import("app/pages/settings/sections/Appearance")
                ).default,
              }),
            },
            {
              path: "security",
              lazy: async () => ({
                Component: (
                  await import("app/pages/settings/sections/Security")
                ).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
