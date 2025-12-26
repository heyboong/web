// Import Dependencies
import PropTypes from "prop-types";
import { forwardRef } from "react";
import clsx from 'clsx'

// Local Imports
import { Box } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";

// -------------------------------------------------------------

const Card = forwardRef((props, ref) => {
  const { cardSkin } = useThemeContext();

  const { skin = cardSkin, children, className, ...rest } = props;

  return (
    <Box
      ref={ref}
      className={clsx(
        "card rounded-2xl",
        skin &&
          skin !== "none" && [
            skin === "bordered" &&
              "border border-gray-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/50 print:border-0",
            skin === "shadow" &&
              "bg-white/70 shadow-soft ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/50 dark:ring-white/10 dark:shadow-none print:shadow-none",
          ],
        className,
      )}
      {...rest}
    >
      {children}
    </Box>
  );
});

Card.displayName = "Card";

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  skin: PropTypes.oneOf(["none", "bordered", "shadow"]),
};

export { Card };
