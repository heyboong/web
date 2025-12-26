import { useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import { settingsService } from "services/settingsService";
import { SettingsContext } from "./context";

// ----------------------------------------------------------------------

const initialState = {
  settings: {
    // Default settings to prevent undefined errors
    site_name: 'Scanvia',
    site_description: 'Your business analytics platform',
    site_url: 'https://via88online.com',
    maintenance_mode: false,
  },
  isLoading: false,
  isInitialized: false,
  error: null,
};

const reducerHandlers = {
  INITIALIZE: (state, action) => {
    const { settings } = action.payload;
    return {
      ...state,
      settings: {
        ...state.settings,
        ...(settings || {}),
      },
      isInitialized: true,
      isLoading: false,
      error: null,
    };
  },

  LOADING: (state) => ({
    ...state,
    isLoading: true,
    error: null,
  }),

  LOAD_SUCCESS: (state, action) => {
    const { settings } = action.payload;
    return {
      ...state,
      settings: {
        ...state.settings,
        ...(settings || {}),
      },
      isLoading: false,
      error: null,
    };
  },

  LOAD_ERROR: (state, action) => {
    const { error } = action.payload;
    return {
      ...state,
      isLoading: false,
      error,
    };
  },

  UPDATE_SETTINGS: (state, action) => {
    const { settings } = action.payload;
    return {
      ...state,
      settings: { ...state.settings, ...settings },
    };
  },
};

const reducer = (state, action) => {
  const handler = reducerHandlers[action.type];
  if (handler) {
    return handler(state, action);
  }
  return state;
};

export function SettingsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const loadSettings = async () => {
      dispatch({ type: "LOADING" });
      
      try {
        const result = await settingsService.getPublicSettings();
        
        if (result.success) {
          dispatch({
            type: "INITIALIZE",
            payload: {
              settings: result.data,
            },
          });
        } else {
          // If API fails, still initialize with default settings
          dispatch({
            type: "INITIALIZE",
            payload: {
              settings: {}, // Will merge with default settings
            },
          });
          console.warn('Settings API failed, using default settings:', result.error);
        }
      } catch (error) {
        // If API fails completely, still initialize with default settings
        dispatch({
          type: "INITIALIZE",
          payload: {
            settings: {}, // Will merge with default settings
          },
        });
        console.warn('Settings API error, using default settings:', error.message);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = (newSettings) => {
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: {
        settings: newSettings,
      },
    });
  };

  const refreshSettings = async () => {
    dispatch({ type: "LOADING" });
    
    try {
      const result = await settingsService.getPublicSettings();
      
      if (result.success) {
        dispatch({
          type: "LOAD_SUCCESS",
          payload: {
            settings: result.data,
          },
        });
      } else {
        dispatch({
          type: "LOAD_ERROR",
          payload: {
            error: result.error,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: "LOAD_ERROR",
        payload: {
          error: error.message,
        },
      });
    }
  };

  if (!children) {
    return null;
  }

  return (
    <SettingsContext
      value={{
        ...state,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext>
  );
}

SettingsProvider.propTypes = {
  children: PropTypes.node,
};
