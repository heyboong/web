import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Textarea, Badge, WebsiteThumbnailUpload, Select } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { GlobeAltIcon, ArrowLeftIcon, PhotoIcon, ServerIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function WebsiteEditPage() {
  useThemeContext();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [domains, setDomains] = useState([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);

  const [websiteData, setWebsiteData] = useState({
    title: '',
    description: '',
    slug: '',
    redirect_url: '',
    language: 'en',
    domain: '',
    thumbnail: ''
  });

  // Load website data
  const loadWebsite = useCallback(async (websiteId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/phishing/websites/${websiteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const websiteData = data.data;
        setWebsiteData({
          title: websiteData.title || '',
          description: websiteData.description || '',
          slug: websiteData.slug || '',
          redirect_url: websiteData.redirect_url || '',
          language: websiteData.language || 'en',
          domain: websiteData.domain || '',
          thumbnail: websiteData.thumbnail || ''
        });

        toast.success('Website loaded successfully!');
      } else {
        toast.error('Failed to load website');
        navigate('/phishing/manage');
      }
    } catch (error) {
      console.error('Error loading website:', error);
      toast.error('Failed to load website');
      navigate('/phishing/manage');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (id) {
      loadWebsite(id);
    } else {
      navigate('/phishing/manage', { replace: true });
    }
  }, [id, loadWebsite, navigate]);

  // Load domains
  useEffect(() => {
    const loadDomains = async () => {
      try {
        setIsLoadingDomains(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/domains', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          const domainOptions = (data.data || [])
            .filter(domain => domain.is_active)
            .map(domain => ({ value: domain.domain_name, label: domain.domain_name }));
          setDomains(domainOptions);
        } else {
          setDomains([]);
        }
      } catch {
        setDomains([]);
      } finally {
        setIsLoadingDomains(false);
      }
    };
    loadDomains();
  }, []);

  const handleInputChange = (field, value) => {
    setWebsiteData(prev => ({ ...prev, [field]: value }));
    if (field === 'title') {
      const slug = (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setWebsiteData(prev => ({ ...prev, slug }));
    }
  };

  const handleSave = async () => {
    if (!websiteData.title.trim()) {
      toast.error('Website title is required');
      return;
    }

    if (!websiteData.slug.trim()) {
      toast.error('Website slug is required');
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/frontend/phishing/websites/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: websiteData.title,
          description: websiteData.description,
          slug: websiteData.slug,
          redirect_url: websiteData.redirect_url,
          language: websiteData.language,
          domain: websiteData.domain,
          thumbnail: websiteData.thumbnail
        })
      });

      if (response.ok) {
        await response.json();
        toast.success('Website updated successfully!');
        navigate('/phishing/manage');
      } else {
        const raw = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(raw);
        } catch {
          errorData = { message: raw };
        }
        const details = errorData.error || errorData.debug;
        const http = `HTTP ${response.status}`;
        toast.error((errorData.message || details || 'Failed to update website') + (details ? ` (${http})` : ''));
      }
    } catch (error) {
      console.error('Error saving website:', error);
      toast.error(error?.message || 'Failed to update website');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Page title="Loading Website">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading website...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={`Edit Website: ${websiteData.title || 'Untitled'}`}>
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
                    <GlobeAltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Edit Website
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Update website information
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/phishing/manage')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    variant="filled"
                    color="primary"
                    onClick={handleSave}
                    disabled={isSaving || !websiteData.title || !websiteData.slug || !websiteData.domain}
                    className="flex items-center gap-2"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Basic Information & Domain */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  Basic Information
              </h3>
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website Title *</label>
                    <Input value={websiteData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Enter website title" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Slug *</label>
                    <Input value={websiteData.slug} onChange={(e) => handleInputChange('slug', e.target.value)} placeholder="website-slug" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <Textarea value={websiteData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Enter website description" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Redirect URL</label>
                    <Input value={websiteData.redirect_url} onChange={(e) => handleInputChange('redirect_url', e.target.value)} placeholder="https://example.com/redirect" type="url" />
                  </div>
                </div>
                {/* Domain Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <ServerIcon className="h-4 w-4 inline mr-1" />
                    Select Domain *
                  </label>
                  {isLoadingDomains ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading domains...</p>
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-amber-600 dark:text-amber-400">No active domains available.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {domains.map((domain) => (
                        <Badge
                          key={domain.value}
                          isGlow={websiteData.domain === domain.value}
                          color={websiteData.domain === domain.value ? 'success' : 'neutral'}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 block w-full text-center py-2 ${websiteData.domain === domain.value ? 'ring-2 ring-green-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          onClick={() => handleInputChange('domain', domain.value)}
                        >
                          {domain.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Column 2: Language */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  Language
                </h3>
                <Select
                  label="Language"
                  value={websiteData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  data={[
                    { value: 'en', label: 'English' },
                    { value: 'vi', label: 'Tiếng Việt' },
                    { value: 'fr', label: 'French' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'de', label: 'German' }
                  ]}
                />
              </Card>
            </div>

            {/* Column 3: Thumbnail & Actions */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Website Thumbnail
                </h3>
                <WebsiteThumbnailUpload
                  value={websiteData.thumbnail}
                  onChange={(value) => handleInputChange('thumbnail', value)}
                  placeholder="Upload website thumbnail"
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                />
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                            <Button
                              variant="filled"
                              color="primary"
                    disabled={isSaving || !websiteData.title || !websiteData.slug || !websiteData.domain}
                    className="w-full h-12 text-base font-semibold"
                    onClick={handleSave}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
