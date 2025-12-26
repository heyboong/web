import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Badge, Modal } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import SubscriptionGuard from "components/guards/SubscriptionGuard";
import { 
  Cog6ToothIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function WebsiteManage() {
  const { isDark } = useThemeContext();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please log in to manage websites');
        return;
      }
      
      const response = await fetch('/api/phishing/websites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebsites(data.data || []);
      } else if (response.status === 401 || response.status === 403) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('authToken');
      } else {
        setError('Failed to load websites');
        toast.error('Failed to load websites');
      }
    } catch (error) {
      console.error('Error loading websites:', error);
      setError('Failed to load websites');
      toast.error('Failed to load websites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (website) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/phishing/websites/${website.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Website deleted successfully');
        loadWebsites();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete website');
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      toast.error('Failed to delete website');
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedWebsite(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredWebsites = websites.filter(website =>
    website.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    website.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Page title="Website Manage">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Website Manage">
        <div className="flex items-center justify-center min-h-screen">
          <Card className={`p-6 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
              <p className="text-red-600 dark:text-red-300">{error}</p>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => window.location.href = '/login'}
                className="mt-4"
              >
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <SubscriptionGuard>
      <Page title="Website Manage">
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
                      <Cog6ToothIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Website Manage
                      </h1>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your phishing websites
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="filled"
                      color="primary"
                      onClick={() => navigate('/phishing/create')}
                    >
                      Create New Website
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search websites..."
              className="max-w-md"
            />
          </div>

          {/* Websites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebsites.map((website) => (
              <Card key={website.id} className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {website.thumbnail ? (
                      <img 
                        src={website.thumbnail} 
                        alt={website.title}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-white/60 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10 flex items-center justify-center">
                        <GlobeAltIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {website.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {website.domain ? `${website.domain}/${website.slug}` : website.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outlined" color="primary">
                    {website.language}
                  </Badge>
                </div>

                {website.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {website.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>{website.view_count || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GlobeAltIcon className="h-4 w-4" />
                    <span>{website.domain || 'No domain'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <EyeIcon className="h-4 w-4" />
                    <span>{new Date(website.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    size="sm"
                    color="info"
                    onClick={() => {
                      const baseUrl = website.domain && website.domain.trim() !== '' 
                        ? `https://${website.domain}` 
                        : window.location.origin;
                      copyToClipboard(`${baseUrl}/${website.slug}`);
                    }}
                    className="flex-1"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outlined"
                    size="sm"
                    color="secondary"
                    onClick={() => {
                      const baseUrl = website.domain && website.domain.trim() !== '' 
                        ? `https://${website.domain}` 
                        : window.location.origin;
                      window.open(`${baseUrl}/${website.slug}`, '_blank');
                    }}
                    className="flex-1"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outlined"
                    size="sm"
                    color="warning"
                    onClick={() => navigate(`/phishing/edit/${website.id}`)}
                    className="flex-1"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="sm"
                    color="error"
                    onClick={() => {
                      setSelectedWebsite(website);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex-1"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredWebsites.length === 0 && (
            <div className="text-center py-12">
              <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No websites found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first website'}
              </p>
              {!searchQuery && (
                <Button
                  variant="filled"
                  color="primary"
                  onClick={() => navigate('/phishing/create')}
                >
                  Create Website
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Delete Website</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete &quot;{selectedWebsite?.title}&quot;? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="error"
              onClick={() => handleDelete(selectedWebsite)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      </Page>
    </SubscriptionGuard>
  );
}
