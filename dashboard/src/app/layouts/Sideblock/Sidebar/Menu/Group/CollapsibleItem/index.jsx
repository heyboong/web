// Import Dependencies
import PropTypes from "prop-types";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

// Local Imports
import { AccordionButton, AccordionItem, AccordionPanel } from "components/ui";
import { MenuItem } from "./MenuItem";
import { useLocaleContext } from "app/contexts/locale/context";

// ----------------------------------------------------------------------

export function CollapsibleItem({ data }) {
  const { path, transKey, Icon, childs } = data;
  const { t } = useTranslation();
  const { isRtl } = useLocaleContext();

  const title = t(transKey) || data.title;
  const ChevronIcon = isRtl ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <AccordionItem value={path} className="relative flex flex-1 flex-col px-3">
      {({ open }) => (
        <>
          <AccordionButton
            className={clsx(
              "group cursor-pointer flex flex-1 items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold outline-hidden transition-colors duration-200",
              open
                ? "bg-gray-100 text-gray-950 shadow-[0_6px_18px_-12px_rgba(15,23,42,0.3)] dark:bg-dark-300/10 dark:text-dark-50"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-950 focus:bg-gray-100 focus:text-gray-950 dark:text-dark-200 dark:hover:bg-dark-300/10 dark:hover:text-dark-50 dark:focus:bg-dark-300/10",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              {Icon && (
                <Icon
                  className={clsx(
                    "size-5 shrink-0 stroke-[1.75]",
                    open ? "opacity-100" : "opacity-80 group-hover:opacity-100",
                  )}
                />
              )}
              <span className="truncate text-[13px]"> {title}</span>
            </div>
            <ChevronIcon
              className={clsx(
                "size-4 shrink-0 transition-transform",
                open && "ltr:rotate-90 rtl:-rotate-90",
              )}
            />
          </AccordionButton>
          <AccordionPanel className="flex flex-col space-y-1 px-3 py-1.5">
            {childs.map((child) => (
              <MenuItem key={child.id} data={child} />
            ))}
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  );
}

CollapsibleItem.propTypes = {
  data: PropTypes.object,
};
