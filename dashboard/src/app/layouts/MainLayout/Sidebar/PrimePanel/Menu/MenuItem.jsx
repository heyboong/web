// Import Dependencies
import PropTypes from "prop-types";
import { NavLink, useRouteLoaderData } from "react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { Badge } from "components/ui";

// ----------------------------------------------------------------------

export function MenuItem({ data }) {
  const { path, transKey, id } = data;
  const { t } = useTranslation();
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();
  const title = t(transKey) || data.title;

  const info = useRouteLoaderData("root")?.[id]?.info;

  const handleMenuItemClick = () => lgAndDown && close();

  return (
    <NavLink
      to={path}
      onClick={handleMenuItemClick}
      className={({ isActive }) =>
        clsx(
          "group relative flex rounded-xl px-3 py-2.5 font-medium outline-hidden transition-colors duration-200",
          isActive
            ? "bg-primary-600/10 text-primary-700 dark:bg-primary-400/15 dark:text-primary-300"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-950 focus:bg-gray-100 focus:text-gray-950 dark:text-dark-200 dark:hover:bg-dark-300/10 dark:hover:text-dark-50 dark:focus:bg-dark-300/10",
        )
      }
    >
      {({ isActive }) => (
        <div
          data-menu-active={isActive}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-xs-plus tracking-wide"
        >
          <span className="mr-1 truncate"> {title}</span>
          {info && info.val && (
            <Badge
              color={info.color}
              variant="soft"
              className="h-5 min-w-[1rem] shrink-0 px-1.5 text-tiny-plus"
            >
              {info.val}
            </Badge>
          )}
          {isActive && (
            <div className="absolute bottom-2 top-2 w-1 rounded-full bg-primary-600 dark:bg-primary-400 ltr:left-0 rtl:right-0" />
          )}
        </div>
      )}
    </NavLink>
  );
}

MenuItem.propTypes = {
  data: PropTypes.object,
};
