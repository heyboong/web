// Import Dependencies
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Collapse } from "components/ui";
import { NAV_TYPE_COLLAPSE, NAV_TYPE_ITEM } from "constants/app.constant";
import { useDisclosure } from "hooks";
import { CollapsibleItem } from "./CollapsibleItem";
import { MenuItem } from "./MenuItem";
import { useThemeContext } from "app/contexts/theme/context";

// ----------------------------------------------------------------------

export function Group({ data }) {
  const [isOpened, { toggle }] = useDisclosure(true);
  const { t } = useTranslation();
  const { cardSkin } = useThemeContext();

  return (
    <div className="pt-3">
      <div
        className={clsx(
          "sticky top-0 z-10 border-b border-white/60 bg-white/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80",
          cardSkin === "bordered" ? "dark:border-dark-700 dark:bg-dark-900/95" : "dark:border-dark-700/70 dark:bg-dark-800/95",
        )}
      >
        <button
          onClick={toggle}
          className="mb-2 flex cursor-pointer items-center gap-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500 outline-hidden transition-colors hover:text-gray-900 focus:text-gray-900 dark:text-dark-300 dark:hover:text-dark-50 dark:focus:text-dark-50"
        >
          <span className="inline-block size-1.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 opacity-70" />
          <span>{t(data.transKey)}</span>
        </button>
        <div
          className={clsx(
            "pointer-events-none absolute inset-x-0 -bottom-2 h-2 bg-linear-to-b from-white/80 to-transparent",
            cardSkin === "bordered"
              ? "dark:from-dark-900/90"
              : "dark:from-dark-800/85",
          )}
        ></div>
      </div>
      <Collapse in={isOpened}>
        <div className="flex flex-col space-y-1">
          {data.childs.map((item) => {
            switch (item.type) {
              case NAV_TYPE_COLLAPSE:
                return <CollapsibleItem key={item.path} data={item} />;
              case NAV_TYPE_ITEM:
                return <MenuItem key={item.path} data={item} />;
              default:
                return null;
            }
          })}
        </div>
      </Collapse>
    </div>
  );
}

Group.propTypes = {
  data: PropTypes.object,
};
