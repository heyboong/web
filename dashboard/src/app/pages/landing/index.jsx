import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  EyeIcon,
  PlusIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PlayIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge } from 'components/ui';

export default function LandingPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'phishing', 'login'

  // Load public templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/templates/public');
        
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.data || []);
        } else {
          console.error('Failed to load templates');
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Filter templates by type
  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    return template.type === filter;
  });

  // Handle demo preview
  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  // Handle create (redirect to dashboard)
  const handleCreate = () => {
    navigate('/dashboards/home');
  };

  // Handle use template (clone with fields)
  const handleUseTemplate = async (template) => {
    try {
      const response = await fetch(`/api/templates/clone/${template.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to login first, then to template editor
        localStorage.setItem('pendingTemplateEdit', result.data.id);
        navigate('/login');
      } else {
        // If not authenticated, redirect to login
        navigate('/login');
      }
    } catch (error) {
      console.error('Error using template:', error);
      navigate('/login');
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ScanVia
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                className="hidden sm:flex"
              >
                Sign In
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge 
              variant="soft" 
              color="primary" 
              className="mb-8 px-6 py-3 text-sm font-semibold shadow-lg backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
            >
              🚀 Professional Security Testing Platform
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Create Stunning
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block mt-2">
                Security Tests
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              Professional-grade phishing templates for security testing and penetration testing. 
              <br className="hidden sm:block" />
              Choose from our curated collection of realistic login pages and phishing sites.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-10 py-5 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <RocketLaunchIcon className="w-6 h-6 mr-3" />
                Start Creating Now
              </Button>
              <Button
                variant="outlined"
                size="lg"
                onClick={() => document.getElementById('templates').scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
              >
                <PlayIcon className="w-6 h-6 mr-3" />
                Explore Templates
              </Button>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredTemplates.length}+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Professional Templates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">99%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose ScanVia?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Powerful features for professional security testing
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Security Focused
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built for professional penetration testing and security assessments with enterprise-grade features.
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GlobeAltIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Realistic Templates
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                High-quality, realistic templates that mirror popular websites and services for effective testing.
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Real-time Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your campaigns in real-time with detailed analytics and comprehensive reporting.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Template Gallery
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Choose from our professional collection of phishing and login templates
            </p>
            
            {/* Filter Buttons */}
            <div className="flex justify-center gap-4 mb-8">
              <Button
                variant={filter === 'all' ? 'filled' : 'outlined'}
                onClick={() => setFilter('all')}
                className="px-6"
              >
                All Templates
              </Button>
              <Button
                variant={filter === 'phishing' ? 'filled' : 'outlined'}
                onClick={() => setFilter('phishing')}
                className="px-6"
              >
                Phishing Pages
              </Button>
              <Button
                variant={filter === 'login' ? 'filled' : 'outlined'}
                onClick={() => setFilter('login')}
                className="px-6"
              >
                Login Pages
              </Button>
            </div>
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {filter === 'all' ? 'No templates available at the moment.' : `No ${filter} templates available.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:scale-105 transform">
                  {/* Template Preview */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail.startsWith('http') ? template.thumbnail : `/${template.thumbnail}`}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${template.thumbnail ? 'hidden' : 'flex'}`}>
                      <div className="text-center">
                        <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No Preview</p>
                      </div>
                    </div>
                    
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="filled"
                        color={template.type === 'phishing' ? 'error' : 'info'}
                        className="text-xs font-medium"
                      >
                        {template.type === 'phishing' ? '🎣 Phishing' : '🔐 Login'}
                      </Badge>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex gap-3">
                        <Button
                          size="sm"
                          variant="filled"
                          onClick={() => handlePreview(template)}
                          className="bg-white/90 text-gray-900 hover:bg-white shadow-lg backdrop-blur-sm"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          Live Demo
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Use Now
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
                      </div>
                    </div>
                    
                    {template.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {(template.created_by_name || 'Admin').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>By {template.created_by_name || 'Admin'}</span>
                      </div>
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handlePreview(template)}
                        className="flex-1 border-2 hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        Live Demo
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to Start Your
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Security Testing?
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-blue-100 mb-10 leading-relaxed">
              Join thousands of security professionals using ScanVia for penetration testing
              <br className="hidden sm:block" />
              Start your free trial today and unlock powerful features
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button
              size="lg"
              onClick={handleCreate}
              className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-5 text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-0"
            >
              <RocketLaunchIcon className="w-6 h-6 mr-3" />
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="lg"
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 text-lg font-bold backdrop-blur-sm transition-all duration-300"
            >
              Sign In
              <ArrowRightIcon className="w-6 h-6 ml-3" />
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-white/80">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <UserGroupIcon className="w-5 h-5" />
              <span className="text-sm font-medium">10,000+ Users</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">ScanVia</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Professional security testing platform for penetration testers and cybersecurity professionals.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="#templates" className="block hover:text-white transition-colors">Templates</a>
                <a href="#" onClick={handleCreate} className="block hover:text-white transition-colors">Template Maker</a>
                <a href="#" onClick={handleCreate} className="block hover:text-white transition-colors">Analytics</a>
                <a href="#" onClick={handleCreate} className="block hover:text-white transition-colors">Real-time Monitoring</a>
              </div>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="#" className="block hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block hover:text-white transition-colors">API Reference</a>
                <a href="#" className="block hover:text-white transition-colors">Tutorials</a>
                <a href="#" className="block hover:text-white transition-colors">Best Practices</a>
              </div>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="https://t.me/scanvia247" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors">
                  Telegram Support
                </a>
                <a href="#" className="block hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block hover:text-white transition-colors">Contact Us</a>
                <a href="#" className="block hover:text-white transition-colors">Status Page</a>
              </div>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
              <div className="text-sm text-gray-400">
                © 2025 ScanVia. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Preview Modal */}
      {isPreviewOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
            onClick={() => setIsPreviewOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preview: {selectedTemplate.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.type === 'phishing' ? '🎣 Phishing Template' : '🔐 Login Template'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Use This Template
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="h-[calc(90vh-88px)]">
              <iframe
                srcDoc={generatePreviewHTML(selectedTemplate)}
                className="w-full h-full border-0"
                title={`Preview: ${selectedTemplate.name}`}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
