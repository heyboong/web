import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Page } from "components/shared/Page";
import { Card, Button, Badge, Modal } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import AnnouncementModal from "components/shared/AnnouncementModal";
import { 
  WrenchScrewdriverIcon,
  StarIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    balance: 0,
    total_balance: 0,
    tool_use_count: 0,
    points: 0,
    recent_tools: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load real data from API
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/dashboard/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success') {
            setAnalytics(result.data);
          } else {
            console.error('Failed to load analytics:', result.message);
            // Fallback to default values
            setAnalytics({
              balance: 0,
              total_balance: 0,
              tool_use_count: 0,
              points: 0,
              recent_tools: [],
              notifications: []
            });
          }
        } else {
          console.error('Failed to fetch analytics:', response.statusText);
          // Fallback to default values
          setAnalytics({
            balance: 0,
            total_balance: 0,
            tool_use_count: 0,
            points: 0,
            recent_tools: [],
            notifications: []
          });
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
        // Fallback to default values
        setAnalytics({
          balance: 0,
          total_balance: 0,
          tool_use_count: 0,
          points: 0,
          recent_tools: [],
          notifications: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
    loadTemplates();
  }, []);

  // Load featured templates
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Load both user's templates and public templates
      const [myTemplatesResponse, publicTemplatesResponse] = await Promise.all([
        fetch('/api/templates/my-templates', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/templates/public')
      ]);
      
      let allTemplates = [];
      
      if (myTemplatesResponse.ok) {
        const myData = await myTemplatesResponse.json();
        allTemplates = [...allTemplates, ...(myData.data || [])];
      }
      
      if (publicTemplatesResponse.ok) {
        const publicData = await publicTemplatesResponse.json();
        allTemplates = [...allTemplates, ...(publicData.data || [])];
      }
      
      // Remove duplicates and limit to 6 most recent
      const uniqueTemplates = allTemplates.reduce((acc, template) => {
        if (!acc.find(t => t.id === template.id)) {
          acc.push(template);
        }
        return acc;
      }, []);
      
      setTemplates(uniqueTemplates.slice(0, 6));
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };


  // Handle template preview
  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  // Handle template create - redirect to phishing creation page
  const handleCreate = () => {
    navigate('/phishing/create');
  };

  // Generate preview HTML
  const generatePreviewHTML = (template) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
  <style>
    ${template.content_css || ''}
  </style>
</head>
<body>
  ${template.content_html || ''}
  <script>
    ${template.content_js || ''}
  </script>
</body>
</html>`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'admin':
        return <BellIcon className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Page title="Dashboard">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Dashboard">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-gradient-to-br from-white/80 via-white/60 to-white/30 p-6 shadow-soft ring-1 ring-gray-900/5 backdrop-blur-2xl dark:border-white/10 dark:from-dark-800/60 dark:via-dark-800/40 dark:to-dark-800/20 dark:ring-white/10">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-500/15 to-primary-500/10 blur-3xl" />
              <div className="relative">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('pages.home.title', { username: user?.username || 'User' })}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {t('pages.home.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Tool Use Count Card */}
            <Card className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <WrenchScrewdriverIcon className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pages.home.toolUseCount')}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics.tool_use_count}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {analytics.tool_use_count} {t('pages.home.uses')}
                </span>
              </div>
            </Card>

            {/* Points Card */}
            <Card className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pages.home.points')}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {(analytics.points || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {analytics.points} {t('pages.home.pointsEarned')}
                </span>
              </div>
            </Card>
          </div>

          {/* Featured Templates Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('pages.home.featuredTemplates')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Professional templates ready to use for your security testing
                </p>
              </div>
              <Button
                variant="outlined"
                onClick={() => navigate('/templates')}
                className="flex items-center gap-2"
              >
                {t('pages.home.browseAll')}
                <SparklesIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Templates Grid */}
            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="animate-pulse">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <Card className="p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No templates available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by browsing our template library
                </p>
                <Button onClick={() => navigate('/templates')} size="sm">
                  Browse Templates
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {templates.map((template) => (
                    <Card key={template.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                      {/* Template Preview */}
                      <div className="relative h-40 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 overflow-hidden">
                        {template.thumbnail ? (
                          <img
                            src={template.thumbnail.startsWith('http') ? template.thumbnail : `/${template.thumbnail}`}
                            alt={template.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${template.thumbnail ? 'hidden' : 'flex'}`}>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center mb-2">
                              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No Preview</p>
                          </div>
                        </div>
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Type Badge */}
                        <div className="absolute top-3 left-3">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                            template.type === 'phishing' 
                              ? 'bg-red-500/90 text-white shadow-red-500/25' 
                              : 'bg-blue-500/90 text-white shadow-blue-500/25'
                          } shadow-lg`}>
                            {template.type === 'phishing' ? '🎣 Phishing' : '🔐 Login'}
                          </div>
                        </div>


                        {/* Hover Actions */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="flex gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <Button
                              size="sm"
                              onClick={() => handlePreview(template)}
                              className="bg-white/95 text-gray-900 hover:bg-white shadow-lg backdrop-blur-sm border-0"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCreate}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg border-0"
                            >
                              <PlusIcon className="w-4 h-4 mr-1" />
                              Create
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-5 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {template.name}
                          </h3>
                        </div>
                        
                        {/* Author Info */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">
                              {(template.created_by_name || 'Admin').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                              {template.created_by_name || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(template.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Active</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3" />
                            <span>Ready</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outlined"
                            size="xs"
                            onClick={() => handlePreview(template)}
                            className="flex-1 text-xs border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors duration-300"
                          >
                            <EyeIcon className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="xs"
                            onClick={handleCreate}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs shadow-md hover:shadow-lg transition-shadow duration-300"
                          >
                            <PlusIcon className="w-3 h-3 mr-1" />
                            Create
                          </Button>
                        </div>
                      </div>

                      {/* Decorative Elements */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-blue-600/10 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </Card>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Tools */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('pages.home.recentTools')}
                </h2>
                <Button variant="outline" size="sm">
                  {t('pages.home.viewAll')}
                </Button>
              </div>
              <div className="space-y-4">
                {(analytics.recent_tools || []).map((tool, index) => (
                  <div key={index} className="flex items-center justify-between rounded-2xl border border-gray-200/60 bg-white/60 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/40">
                    <div className="flex items-center">
                      <WrenchScrewdriverIcon className="h-5 w-5 text-purple-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('pages.home.lastUsed')}: {tool.last_used}
                        </p>
                      </div>
                    </div>
                    <Badge color="neutral" variant="soft">
                      {tool.uses} {t('pages.home.uses')}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('pages.home.notifications')}
                </h2>
                <Button variant="outline" size="sm">
                  {t('pages.home.markAllRead')}
                </Button>
              </div>
              <div className="space-y-4">
                {(analytics.notifications || []).map((notification) => (
                  <div key={notification.id} className={`flex items-start rounded-2xl border p-4 backdrop-blur-xl ${
                    notification.unread ? 'border-blue-200/60 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-900/15' : 'border-gray-200/60 bg-white/60 dark:border-white/10 dark:bg-dark-800/40'
                  }`}>
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          notification.unread ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {isPreviewOpen && selectedTemplate && (
        <Modal
          open={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Preview: ${selectedTemplate.name}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedTemplate.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.type === 'phishing' ? '🎣 Phishing Template' : '🔐 Login Template'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Create
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe
                srcDoc={generatePreviewHTML(selectedTemplate)}
                className="w-full h-full"
                title={`Preview: ${selectedTemplate.name}`}
                sandbox="allow-scripts allow-same-origin allow-forms"
                frameBorder="0"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* System Announcement Modal */}
      <AnnouncementModal />
    </Page>
  );
}
