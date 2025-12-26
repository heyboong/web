import { createSafeContext } from "utils/createSafeContext";

export const [SettingsContext, useSettingsContext] = createSafeContext(
    "useSettingsContext must be used within SettingsProvider"
);
