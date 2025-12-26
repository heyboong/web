import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Textarea, Modal, Badge, WebsiteSuccessModal, WebsiteThumbnailUpload } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import SubscriptionGuard from "components/guards/SubscriptionGuard";
import { 
  PlusIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PhotoIcon,
  LanguageIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function CreateWebsite() {
  const { isDark } = useThemeContext();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states for two-step template selection
  const [isPhishingModalOpen, setIsPhishingModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Template states
  const [selectedPhishingTemplate, setSelectedPhishingTemplate] = useState(null);
  const [selectedLoginTemplate, setSelectedLoginTemplate] = useState(null);
  
  // Success modal states
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdWebsite, setCreatedWebsite] = useState(null);
  
  const [domains, setDomains] = useState([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [phishingTemplates, setPhishingTemplates] = useState([]);
  const [loginTemplates, setLoginTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    redirect_url: '',
    temp1: '', // Legacy HTML content (for backward compatibility)
    temp2: '', // Legacy HTML content (for backward compatibility)
    phishing_template_id: null, // New template ID
    login_template_id: null, // New template ID
    thumbnail: '',
    language: 'en',
    domain: ''
  });

  // Load templates from database
  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const token = localStorage.getItem('authToken');
      
      // Load both user's templates and public approved templates
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
      
      // Add user's templates
      if (myTemplatesResponse.ok) {
        const myData = await myTemplatesResponse.json();
        const userTemplates = myData.data.map(template => ({
          ...template,
          isOwned: true,
          temp1: template.content_html || '',
          temp2: template.content_html || ''
        }));
        allTemplates = [...allTemplates, ...userTemplates];
      }
      
      // Add public templates
      if (publicTemplatesResponse.ok) {
        const publicData = await publicTemplatesResponse.json();
        const communityTemplates = publicData.data.map(template => ({
          ...template,
          isOwned: false,
          temp1: template.content_html || '',
          temp2: template.content_html || ''
        }));
        allTemplates = [...allTemplates, ...communityTemplates];
      }
      
      // Remove duplicates by ID (prefer user's own templates over public ones)
      const uniqueTemplates = allTemplates.reduce((acc, current) => {
        const existingIndex = acc.findIndex(template => template.id === current.id);
        if (existingIndex !== -1) {
          // If duplicate found, keep the user's own template (isOwned: true)
          if (current.isOwned && !acc[existingIndex].isOwned) {
            acc[existingIndex] = current;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Separate phishing and login templates
      const phishingList = uniqueTemplates.filter(template => template.type === 'phishing');
      const loginList = uniqueTemplates.filter(template => template.type === 'login');
      
      // Debug: Log template data to check thumbnails
      console.log('Loaded templates:', {
        phishing: phishingList.map(t => ({ id: t.id, name: t.name, thumbnail: t.thumbnail })),
        login: loginList.map(t => ({ id: t.id, name: t.name, thumbnail: t.thumbnail }))
      });
      
      setPhishingTemplates(phishingList);
      setLoginTemplates(loginList);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

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
    loadTemplates();
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

  const handlePhishingTemplateSelect = (template) => {
    setSelectedPhishingTemplate(template);
    setFormData(prev => ({
      ...prev,
      phishing_template_id: template.id,
      temp1: template.temp1, // Keep for backward compatibility during transition
      thumbnail: template.thumbnail
    }));
    setIsPhishingModalOpen(false);
    // Auto-open login template selection after phishing template is selected
    setIsLoginModalOpen(true);
  };

  const handleLoginTemplateSelect = (template) => {
    setSelectedLoginTemplate(template);
    setFormData(prev => ({
      ...prev,
      login_template_id: template.id,
      temp2: template.temp1 // Keep for backward compatibility during transition
    }));
    setIsLoginModalOpen(false);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    setCreatedWebsite(null);
    
    // Reset form for creating another website
    setFormData({
      title: '',
      description: '',
      slug: '',
      redirect_url: '',
      temp1: '',
      temp2: '',
      phishing_template_id: null,
      login_template_id: null,
      thumbnail: '',
      language: 'en',
      domain: ''
    });
    setSelectedPhishingTemplate(null);
    setSelectedLoginTemplate(null);
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
        const result = await response.json();
        toast.success('Website created successfully!');
        
        // Set created website data and show success modal
        setCreatedWebsite({
          id: result.data?.id,
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          redirect_url: formData.redirect_url,
          domain: formData.domain,
          language: formData.language,
          created_at: new Date().toISOString()
        });
        setIsSuccessModalOpen(true);
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
    <SubscriptionGuard>
      <Page title={t('pages.phishing.create.title')}>
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-gradient-to-br from-white/80 via-white/60 to-white/30 p-6 shadow-soft ring-1 ring-gray-900/5 backdrop-blur-2xl dark:border-white/10 dark:from-dark-800/60 dark:via-dark-800/40 dark:to-dark-800/20 dark:ring-white/10">
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-500/15 to-primary-500/10 blur-3xl" />

                <div className="relative flex items-start gap-4">
                  <div className="rounded-2xl bg-white/50 p-3 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                    <PlusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {t('pages.phishing.create.title')}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {t('pages.phishing.create.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Basic Information & Domain Selection */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  {t('pages.phishing.create.basicInfo')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('pages.phishing.create.websiteTitle')} *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder={t('pages.phishing.create.websiteTitlePlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('pages.phishing.create.urlSlug')} *
                    </label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="website-slug"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('pages.phishing.create.description')}
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder={t('pages.phishing.create.descriptionPlaceholder')}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('pages.phishing.create.redirectUrl')}
                    </label>
                    <Input
                      value={formData.redirect_url}
                      onChange={(e) => handleInputChange('redirect_url', e.target.value)}
                      placeholder="https://example.com/redirect"
                      type="url"
                    />
                  </div>
                </div>

                {/* Domain Selection with Badges */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <ServerIcon className="h-4 w-4 inline mr-1" />
                    {t('pages.phishing.create.selectDomain')} *
                  </label>
                  
                  {isLoadingDomains ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">{t('common.loading')}</p>
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        No active domains available. Please contact admin to create domains.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {domains.map((domain) => (
                        <Badge
                          key={domain.value}
                          isGlow={formData.domain === domain.value}
                          color={formData.domain === domain.value ? "success" : "neutral"}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 block w-full text-center py-2 ${
                            formData.domain === domain.value ? 'ring-2 ring-green-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
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

            {/* Column 2: Template & Language Selection */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  {t('pages.phishing.create.templateLanguage')}
                </h3>

                {/* Phishing Template Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('pages.phishing.create.phishingTemplate')}
                  </label>
                  
                  {selectedPhishingTemplate ? (
                    <div className={`p-4 border-2 rounded-lg transition-all ${
                      isDark ? 'border-green-500 bg-green-500/10' : 'border-green-400 bg-green-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        {selectedPhishingTemplate.thumbnail ? (
                          <img 
                            src={selectedPhishingTemplate.thumbnail} 
                            alt={selectedPhishingTemplate.name}
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{selectedPhishingTemplate.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPhishingTemplate.description}</p>
                          <Badge variant="filled" color="primary" className="text-xs mt-1">Phishing</Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 border-2 border-dashed rounded-lg text-center ${
                      isDark ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50'
                    }`}>
                      <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">{t('pages.phishing.create.noPhishingSelected')}</p>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    className="w-full mt-3"
                    onClick={() => setIsPhishingModalOpen(true)}
                  >
                    {selectedPhishingTemplate ? t('pages.phishing.create.selectPhishingTemplate') : t('pages.phishing.create.selectPhishingTemplate')}
                  </Button>
                </div>

                {/* Login Template Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('pages.phishing.create.loginTemplate')} <span className="text-red-500">*</span>
                  </label>
                  
                  {selectedLoginTemplate ? (
                    <div className={`p-4 border-2 rounded-lg transition-all ${
                      isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-400 bg-blue-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        {selectedLoginTemplate.thumbnail ? (
                          <img 
                            src={selectedLoginTemplate.thumbnail} 
                            alt={selectedLoginTemplate.name}
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{selectedLoginTemplate.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLoginTemplate.description}</p>
                          <Badge variant="filled" color="secondary" className="text-xs mt-1">Login</Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 border-2 border-dashed rounded-lg text-center ${
                      isDark ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50'
                    }`}>
                      <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">No login template selected</p>
                      <p className="text-red-500 text-xs mt-1">Login template is required</p>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    className="w-full mt-3"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    {selectedLoginTemplate ? 'Change Login Template' : 'Select Login Template'}
                  </Button>
                </div>

                {/* Language Selection with Flags */}
                <div style={{ display: 'none' }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <LanguageIcon className="h-4 w-4 inline mr-1" />
                    Select Language
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((language) => (
                      <div
                        key={language.value}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                          formData.language === language.value
                            ? isDark 
                              ? 'border-green-500 bg-green-500/20 ring-2 ring-green-300' 
                              : 'border-green-400 bg-green-50 ring-2 ring-green-300'
                            : isDark
                              ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleInputChange('language', language.value)}
                      >
                        <div className="flex items-center space-x-2">
                          <img 
                            src={language.flagUrl} 
                            alt={language.flag}
                            className="w-6 h-4 rounded object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <span className={`text-sm font-medium ${
                            formData.language === language.value 
                              ? 'text-green-700 dark:text-green-300' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {language.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Column 3: Thumbnail & Actions */}
            <div>
              <Card className={`p-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Media & Actions
                </h3>

                <div className="space-y-6">
                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Website Thumbnail
                    </label>
                    <WebsiteThumbnailUpload
                      value={formData.thumbnail}
                      onChange={(value) => handleInputChange('thumbnail', value)}
                      placeholder="Upload website thumbnail"
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                    />
                  </div>

                  {/* Create Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="filled"
                      color="primary"
                      disabled={isLoading || !formData.title || !formData.slug || !formData.domain || !selectedLoginTemplate}
                      className="w-full h-12 text-base font-semibold"
                      onClick={handleSubmit}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Create Website
                        </div>
                      )}
                    </Button>
                    
                    {(!formData.title || !formData.slug || !formData.domain || !selectedLoginTemplate) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                        Please fill in required fields: Title, Slug, Domain, and Login Template
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Phishing Template Selection Modal */}
          <Modal
            open={isPhishingModalOpen}
            onClose={() => setIsPhishingModalOpen(false)}
            title="Select Phishing Template"
            size="lg"
          >
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading templates...</p>
                </div>
              </div>
            ) : phishingTemplates.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Phishing Templates Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first phishing template or wait for community templates to be approved.
                </p>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsPhishingModalOpen(false);
                    window.open('/admin/phishing/templates', '_blank');
                  }}
                >
                  Create Template
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Choose from {phishingTemplates.length} available phishing template{phishingTemplates.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {phishingTemplates.map((template, index) => (
                    <div
                      key={`phishing-${template.id}-${index}-${template.name}`}
                      className={`cursor-pointer p-3 border rounded-lg transition-all hover:scale-[1.02] ${
                        selectedPhishingTemplate?.id === template.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                      onClick={() => handlePhishingTemplateSelect(template)}
                    >
                      <div className="aspect-video mb-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden relative">
                        {template.thumbnail && template.thumbnail.trim() !== '' && template.thumbnail !== 'null' ? (
                          <>
                            <img
                              src={template.thumbnail.startsWith('/') ? template.thumbnail : `/${template.thumbnail}`}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              style={{ display: 'block' }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', template.thumbnail);
                              }}
                              onError={(e) => {
                                console.log('Image failed to load:', template.thumbnail);
                                // If image fails to load, show fallback
                                e.target.style.display = 'none';
                                const fallback = e.target.parentNode.querySelector('.fallback-icon');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="fallback-icon w-full h-full absolute inset-0 items-center justify-center" style={{ display: 'none' }}>
                              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Ownership Badge */}
                        {template.isOwned && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="filled" color="success" className="text-xs">
                              Mine
                            </Badge>
                          </div>
                        )}
                        
                        {!template.isOwned && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outlined" color="info" className="text-xs">
                              Community
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{template.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {template.description || 'No description available'}
                      </p>
                      
                      {template.created_by_name && !template.isOwned && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          by {template.created_by_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal>

          {/* Login Template Selection Modal */}
          <Modal
            open={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            title="Select Login Template (Required)"
            size="lg"
          >
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading templates...</p>
                </div>
              </div>
            ) : loginTemplates.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Login Templates Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first login template or wait for community templates to be approved. Login template is required to create a phishing website.
                </p>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    window.open('/admin/phishing/templates', '_blank');
                  }}
                >
                  Create Template
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Choose from {loginTemplates.length} available login template{loginTemplates.length !== 1 ? 's' : ''}. <span className="text-red-500 font-medium">Login template is required.</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {loginTemplates.map((template, index) => (
                    <div
                      key={`login-${template.id}-${index}-${template.name}`}
                      className={`cursor-pointer p-3 border rounded-lg transition-all hover:scale-[1.02] ${
                        selectedLoginTemplate?.id === template.id
                          ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-secondary-300'
                      }`}
                      onClick={() => handleLoginTemplateSelect(template)}
                    >
                      <div className="aspect-video mb-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden relative">
                        {template.thumbnail && template.thumbnail.trim() !== '' && template.thumbnail !== 'null' ? (
                          <>
                            <img
                              src={template.thumbnail.startsWith('/') ? template.thumbnail : `/${template.thumbnail}`}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              style={{ display: 'block' }}
                              onLoad={() => {
                                console.log('Login template image loaded successfully:', template.thumbnail);
                              }}
                              onError={(e) => {
                                console.log('Login template image failed to load:', template.thumbnail);
                                // If image fails to load, show fallback
                                e.target.style.display = 'none';
                                const fallback = e.target.parentNode.querySelector('.fallback-icon');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="fallback-icon w-full h-full absolute inset-0 items-center justify-center" style={{ display: 'none' }}>
                              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Ownership Badge */}
                        {template.isOwned && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="filled" color="success" className="text-xs">
                              Mine
                            </Badge>
                          </div>
                        )}
                        
                        {!template.isOwned && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outlined" color="info" className="text-xs">
                              Community
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{template.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {template.description || 'No description available'}
                      </p>
                      
                      {template.created_by_name && !template.isOwned && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          by {template.created_by_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal>

          {/* Success Modal */}
          <WebsiteSuccessModal
            isOpen={isSuccessModalOpen}
            onClose={handleSuccessModalClose}
            websiteData={createdWebsite}
          />
          </div>
        </div>
      </Page>
    </SubscriptionGuard>
  );
}
