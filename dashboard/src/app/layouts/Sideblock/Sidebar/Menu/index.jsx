// Import Dependencies
import { useLocation } from "react-router";
import { useRef, useState } from "react";
import {
  useDidUpdate,
  useIsomorphicEffect,
} from "hooks";
import SimpleBar from "simplebar-react";

// Local Imports
import { useNavigation } from "hooks/useNavigation";
import { useAuthContext } from "app/contexts/auth/context";
import { Group } from "./Group";
import { Accordion } from "components/ui";
import { isRouteActive } from "utils/isRouteActive";

// ----------------------------------------------------------------------

export function Menu() {
  const { pathname } = useLocation();
  const { ref } = useRef();
  const { isAdmin } = useAuthContext();
  const { navigation: dynamicNavigation } = useNavigation(isAdmin);

  const activeGroup = dynamicNavigation.find((item) => {
    if (item.path) return isRouteActive(item.path, pathname);
  });

  const activeCollapsible = activeGroup?.childs?.find((item) => {
    if (item.path) return isRouteActive(item.path, pathname);
  });

  const [expanded, setExpanded] = useState(activeCollapsible?.path || null);

  useDidUpdate(() => {
    activeCollapsible?.path !== expanded &&
      setExpanded(activeCollapsible?.path);
  }, [activeCollapsible?.path]);

  useIsomorphicEffect(() => {
    const activeItem = ref?.current.querySelector("[data-menu-active=true]");
    activeItem?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <SimpleBar
      scrollableNodeProps={{ ref }}
      className="h-full overflow-x-hidden pb-4"
    >
      <Accordion value={expanded} onChange={setExpanded} className="space-y-1.5">
        {dynamicNavigation.map((nav) => (
          <Group key={nav.id} data={nav} />
        ))}
      </Accordion>
    </SimpleBar>
  );
}
