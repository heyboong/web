// Import Dependencies
import { Portal } from "@headlessui/react";
import { clsx } from "clsx";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { useThemeContext } from "app/contexts/theme/context";
import { useDidUpdate } from "hooks";
import { Header } from "./Header";
import { Menu } from "./Menu";

// ----------------------------------------------------------------------

export function Sidebar() {
  const { cardSkin } = useThemeContext();
  const { name, lgAndDown } = useBreakpointsContext();

  const { isExpanded: isSidebarExpanded, close: closeSidebar } =
    useSidebarContext();

  useDidUpdate(() => {
    isSidebarExpanded && closeSidebar();
  }, [name]);

  return (
    <div
      className={clsx(
        "sidebar-panel",
        cardSkin === "shadow"
          ? "shadow-soft dark:shadow-dark-900/60"
          : "dark:border-dark-600/80 ltr:border-r rtl:border-l border-gray-200",
      )}
    >
      <div
        className={clsx(
          "flex h-full grow flex-col gap-3 bg-gradient-to-b from-white/85 via-white/70 to-white/50 px-3 pb-4 pt-2 backdrop-blur-xl",
          cardSkin === "shadow"
            ? "dark:from-dark-750/85 dark:via-dark-750/65 dark:to-dark-750/45"
            : "dark:from-dark-900/85 dark:via-dark-900/65 dark:to-dark-900/45",
        )}
      >
        <Header />
        <Menu />
      </div>

      {lgAndDown && isSidebarExpanded && (
        <Portal>
          <div
            onClick={closeSidebar}
            className="fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
          />
        </Portal>
      )}
    </div>
  );
}
