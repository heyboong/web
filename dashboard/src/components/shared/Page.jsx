// Import Dependencies
import PropTypes from "prop-types";
import { Fragment } from "react";

// Local Imports
import { useDocumentTitle } from "hooks";
import { useSettings } from "hooks/useSettings";

// ----------------------------------------------------------------------

const Page = ({ title = "", component = Fragment, children }) => {
  const Component = component;
  const { getSiteName } = useSettings();
  const siteName = getSiteName();
  useDocumentTitle(title + " - " + siteName);
  return <Component>{children}</Component>;
};

Page.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  component: PropTypes.elementType,
};

export { Page };
