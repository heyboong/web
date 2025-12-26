// Import Dependencies
import { useMemo, useState } from "react";
import { useLocation } from "react-router";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { useAuthContext } from "app/contexts/auth/context";
import { useNavigation } from "hooks/useNavigation";
import { useDidUpdate } from "hooks";
import { isRouteActive } from "utils/isRouteActive";
import { MainPanel } from "./MainPanel";
import { PrimePanel } from "./PrimePanel";

// ----------------------------------------------------------------------

export function Sidebar() {
  const { pathname } = useLocation();
  const { name, lgAndDown } = useBreakpointsContext();
  const { isExpanded, close } = useSidebarContext();
  const { isAdmin } = useAuthContext();
  const { navigation: dynamicNavigation } = useNavigation(isAdmin);

  // Use dynamic navigation with balance
  const filteredNavigation = useMemo(() => {
    return dynamicNavigation.filter(item => {
      // Always show dashboards
      if (item.id === 'dashboards') return true;
      // Only show admin menu to admin users
      if (item.id === 'admin') return isAdmin;
      return true;
    });
  }, [dynamicNavigation, isAdmin]);

  const initialSegment = useMemo(
    () => filteredNavigation.find((item) => isRouteActive(item.path, pathname)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredNavigation],
  );

  const [activeSegmentPath, setActiveSegmentPath] = useState(
    initialSegment?.path,
  );

  const currentSegment = useMemo(() => {
    return filteredNavigation.find((item) => item.path === activeSegmentPath);
  }, [activeSegmentPath, filteredNavigation]);

  useDidUpdate(() => {
    const activePath = filteredNavigation.find((item) =>
      isRouteActive(item.path, pathname),
    )?.path;

    if (!isRouteActive(activeSegmentPath, pathname)) {
      setActiveSegmentPath(activePath);
    }
  }, [pathname, filteredNavigation]);

  useDidUpdate(() => {
    if (lgAndDown && isExpanded) close();
  }, [name]);

  return (
    <>
      <MainPanel
        nav={filteredNavigation}
        activeSegment={activeSegmentPath}
        setActiveSegment={setActiveSegmentPath}
      />
      <PrimePanel
        close={close}
        currentSegment={currentSegment}
        pathname={pathname}
      />
    </>
  );
}
