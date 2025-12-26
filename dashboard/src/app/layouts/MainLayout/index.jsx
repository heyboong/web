// Import Dependencies
import clsx from "clsx";
import { Outlet } from "react-router";

// Local Imports
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { usePageViewTracking } from "hooks/usePageViewTracking";

// ----------------------------------------------------------------------

export default function MainLayout() {
  // Track page views for all pages
  usePageViewTracking();

  return (
    <>
      <Header />
      <main
        className={clsx("main-content transition-content grid grid-cols-1")}
      >
        <Outlet />
      </main>
      <Sidebar />
    </>
  );
}
