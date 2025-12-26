// Import Dependencies
import { useEffect, useReducer } from "react";
import isObject from "lodash/isObject";
import PropTypes from "prop-types";
import isString from "lodash/isString";
import { toast } from "sonner";

// Local Imports
import axios from "utils/axios";
import { isTokenValid, setSession } from "utils/jwt";
import { saveRegisteredUsername } from "utils/cookies";
import { navigateTo, getRedirectUrl } from "utils/navigation";
import { AuthContext } from "./context";

// ----------------------------------------------------------------------

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  user: null,
  isUpdatingProfile: false,
  profileError: null,
  isAdmin: false,
};

const reducerHandlers = {
  INITIALIZE: (state, action) => {
    const { isAuthenticated, user } = action.payload;
    const isAdmin = user?.is_admin === 1 || user?.is_admin === true || user?.role === 'admin' || user?.username === 'vohuunhan';
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
      isAdmin,
    };
  },

  LOGIN_REQUEST: (state) => {
    return {
      ...state,
      isLoading: true,
      errorMessage: null,
    };
  },

  LOGIN_SUCCESS: (state, action) => {
    const { user } = action.payload;
    const isAdmin = user?.is_admin === 1 || user?.is_admin === true || user?.role === 'admin' || user?.username === 'vohuunhan';
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user,
      isAdmin,
      errorMessage: null,
    };
  },

  LOGIN_ERROR: (state, action) => {
    const { errorMessage } = action.payload;

    return {
      ...state,
      errorMessage,
      isLoading: false,
    };
  },

  SIGNUP_REQUEST: (state) => {
    return {
      ...state,
      isLoading: true,
      errorMessage: null,
    };
  },

  SIGNUP_SUCCESS: (state, action) => {
    const { user } = action.payload;
    const isAdmin = user?.is_admin === 1 || user?.is_admin === true || user?.role === 'admin' || user?.username === 'vohuunhan';
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user,
      isAdmin,
      errorMessage: null,
    };
  },

  SIGNUP_ERROR: (state, action) => {
    const { errorMessage } = action.payload;

    return {
      ...state,
      errorMessage,
      isLoading: false,
    };
  },

  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    errorMessage: null,
  }),

  PROFILE_UPDATE_REQUEST: (state) => ({
    ...state,
    isUpdatingProfile: true,
    profileError: null,
  }),

  PROFILE_UPDATE_SUCCESS: (state, action) => {
    const { user } = action.payload;
    return {
      ...state,
      isUpdatingProfile: false,
      user,
      profileError: null,
    };
  },

  PROFILE_UPDATE_ERROR: (state, action) => {
    const { errorMessage } = action.payload;
    return {
      ...state,
      isUpdatingProfile: false,
      profileError: errorMessage,
    };
  },

  AVATAR_UPDATE_SUCCESS: (state, action) => {
    const { user } = action.payload;
    return {
      ...state,
      user,
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

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const authToken = window.localStorage.getItem("authToken");

        if (authToken && isTokenValid(authToken)) {
          setSession(authToken);

          const response = await axios.get("/api/user/profile");
          const { user } = response.data;

          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: true,
              user,
            },
          });
        } else {
          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: "INITIALIZE",
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    };

    init();
  }, []);

  const login = async ({ username, password }) => {
    dispatch({
      type: "LOGIN_REQUEST",
    });

    try {
      const response = await axios.post("/api/login", {
        username,
        password,
      });

      const { authToken, user } = response.data;

      if (!isString(authToken) && !isObject(user)) {
        throw new Error("Response is not valid");
      }

      setSession(authToken);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user,
        },
      });

      // Show success toast
      toast.success("Login successful!", {
        description: `Welcome back, ${user.username}!`,
        duration: 3000,
      });

      // Handle pending template edit after login
      const pendingTemplateId = localStorage.getItem('pendingTemplateEdit');
      if (pendingTemplateId) {
        localStorage.removeItem('pendingTemplateEdit');
        // Delay navigation to allow auth state to settle
        setTimeout(() => {
          window.location.href = `/template-maker/edit/${pendingTemplateId}`;
        }, 1000);
      }

      // Track login for analytics and points
      try {
        const token = localStorage.getItem('authToken');
        const analyticsResponse = await fetch('/api/analytics/track-login', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.status === 'success' && analyticsResult.pointsAwarded > 0) {
          toast.success("Points earned!", {
            description: `You earned ${analyticsResult.pointsAwarded} points for logging in!`,
            duration: 4000,
          });
        }
      } catch (analyticsError) {
        console.error('Failed to track login analytics:', analyticsError);
      }

      // Redirect logic - use navigation utility
      const redirectTo = getRedirectUrl('/dashboards/home');
      navigateTo(redirectTo, 1000);

    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Login failed";
      
      // Show error toast
      toast.error("Login failed", {
        description: errorMessage,
        duration: 4000,
      });

      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage,
        },
      });
    }
  };

  const signup = async ({ username, email, password, confirm_password }) => {
    dispatch({
      type: "SIGNUP_REQUEST",
    });

    try {
      const response = await axios.post("/api/signup", {
        username,
        email,
        password,
        confirm_password,
      });

      const { authToken, user } = response.data;

      if (!isString(authToken) && !isObject(user)) {
        throw new Error("Response is not valid");
      }

      setSession(authToken);

      dispatch({
        type: "SIGNUP_SUCCESS",
        payload: {
          user,
        },
      });

      // Save username in cookie for auto-fill on login page
      saveRegisteredUsername(username);

      // Track registration for analytics and points
      try {
        const analyticsResponse = await fetch('/api/analytics/track-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user.id })
        });

        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.status === 'success' && analyticsResult.pointsAwarded > 0) {
          toast.success("Welcome bonus!", {
            description: `You earned ${analyticsResult.pointsAwarded} points for registering!`,
            duration: 4000,
          });
        }
      } catch (analyticsError) {
        console.error('Failed to track registration analytics:', analyticsError);
      }

      // Show success toast
      toast.success("Account created successfully!", {
        description: `Welcome, ${user.username}! Redirecting to login...`,
        duration: 3000,
      });

      // Redirect to login page with auto-fill
      const loginUrl = `/login?username=${encodeURIComponent(username)}`;
      navigateTo(loginUrl, 1500);

    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Signup failed";
      
      // Show error toast
      toast.error("Registration failed", {
        description: errorMessage,
        duration: 4000,
      });

      dispatch({
        type: "SIGNUP_ERROR",
        payload: {
          errorMessage,
        },
      });
    }
  };

  const updateProfile = async (profileData) => {
    dispatch({
      type: "PROFILE_UPDATE_REQUEST",
    });

    try {
      const response = await axios.put('/api/user/profile', profileData);

      if (response.data.status === 'success') {
        dispatch({
          type: "PROFILE_UPDATE_SUCCESS",
          payload: {
            user: response.data.user,
          },
        });

        // Show success toast
        toast.success('Profile updated successfully!', {
          description: 'Your profile information has been saved.',
          duration: 3000,
        });

        return {
          success: true,
          user: response.data.user,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update profile';
      
      // Show error toast
      toast.error('Profile update failed', {
        description: errorMessage,
        duration: 4000,
      });

      dispatch({
        type: "PROFILE_UPDATE_ERROR",
        payload: {
          errorMessage,
        },
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const updateAvatar = async (avatarFile) => {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await axios.post('/api/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.status === 'success') {
        dispatch({
          type: "AVATAR_UPDATE_SUCCESS",
          payload: {
            user: response.data.user,
          },
        });

        // Show success toast
        toast.success('Avatar updated successfully!', {
          description: 'Your profile picture has been updated.',
          duration: 3000,
        });

        return {
          success: true,
          user: response.data.user,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Avatar update failed');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update avatar';
      
      // Show error toast
      toast.error('Avatar update failed', {
        description: errorMessage,
        duration: 4000,
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    const username = state.user?.username || 'User';
    
    setSession(null);
    dispatch({ type: "LOGOUT" });

    // Show logout toast
    toast.info("Logged out successfully", {
      description: `Goodbye, ${username}! See you next time.`,
      duration: 2000,
    });

    // Redirect to login page
    navigateTo('/login', 1000);
  };

  if (!children) {
    return null;
  }

  return (
    <AuthContext
      value={{
        ...state,
        login,
        signup,
        logout,
        updateProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
