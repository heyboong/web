import { useState, useEffect } from 'react';
import { dashboards } from "../app/navigation/dashboards";
import { phishing } from "../app/navigation/phishing";
import { templates } from "../app/navigation/templates";
import { admin } from "../app/navigation/admin";

export const useNavigation = (isAdmin = false) => {
  const [navigation, setNavigation] = useState([]);

  useEffect(() => {
    const baseNavigation = [
      dashboards,
      phishing,
      templates,
    ];

    // Only add admin menu for admin users
    if (isAdmin) {
      baseNavigation.push(admin);
    }

    setNavigation(baseNavigation);
  }, [isAdmin]);

  return { navigation, balance: 0 };
};
