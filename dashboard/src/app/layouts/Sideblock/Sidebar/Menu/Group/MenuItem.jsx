// Import Dependencies
import PropTypes from "prop-types";
import clsx from "clsx";
import { NavLink, useRouteLoaderData } from "react-router";
import { useTranslation } from "react-i18next";

// Local Imports
import { Badge } from "components/ui";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";

// ----------------------------------------------------------------------

export function MenuItem({ data }) {
  const { Icon, path, id, transKey } = data;
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();
  const { t } = useTranslation();

  const title = t(transKey) || data.title;

  const info = useRouteLoaderData("root")?.[id]?.info;

  const handleMenuItemClick = () => lgAndDown && close();

  return (
    <div className="relative flex px-3">
      <NavLink
        to={path}
        onClick={handleMenuItemClick}
        className={({ isActive }) =>
          clsx(
            "group relative min-w-0 flex-1 rounded-lg px-2.5 py-2 text-sm font-medium outline-hidden transition-colors duration-200",
            isActive
              ? "bg-gradient-to-r from-primary-50 to-primary-50/70 text-primary-700 shadow-[0_6px_18px_-12px_rgba(59,130,246,0.55)] dark:from-primary-500/15 dark:to-primary-500/10 dark:text-primary-200"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-950 focus:bg-gray-100 focus:text-gray-950 dark:text-dark-200 dark:hover:bg-dark-300/10 dark:hover:text-dark-50 dark:focus:bg-dark-300/10",
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              data-menu-active={isActive}
              className="flex min-w-0 items-center justify-between gap-2 text-xs-plus tracking-wide"
            >
              <div className="flex min-w-0 items-center gap-3">
                {Icon && (
                  <span
                    className={clsx(
                      "flex size-8 items-center justify-center rounded-lg border text-gray-500 transition-colors",
                      isActive
                        ? "border-primary-100/70 bg-primary-50/80 text-primary-600 dark:border-primary-400/30 dark:bg-primary-500/10 dark:text-primary-100"
                        : "border-gray-100 bg-gray-50/70 hover:border-gray-200 dark:border-dark-600 dark:bg-dark-700/50 dark:text-dark-200",
                    )}
                  >
                    <Icon
                      className={clsx(
                        "size-4.5 shrink-0 stroke-[1.65]",
                        isActive ? "opacity-100" : "opacity-80",
                      )}
                    />
                  </span>
                )}
                <span className="truncate text-[13px] font-semibold">{title}</span>
              </div>
              {info && info.val && (
                <Badge
                  color={info.color}
                  variant="soft"
                  className="h-5 min-w-[1rem] shrink-0 px-1.5 text-[11px] font-semibold"
                >
                  {info.val}
                </Badge>
              )}
            </div>
            {isActive && (
              <div className="absolute bottom-2 top-2 w-1 rounded-full bg-primary-500/90 shadow-[0_0_12px_rgba(59,130,246,0.45)] dark:bg-primary-400 ltr:left-0 rtl:right-0" />
            )}
          </>
        )}
      </NavLink>
    </div>
  );
}

MenuItem.propTypes = {
  data: PropTypes.object,
};
