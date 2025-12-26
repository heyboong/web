import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Modal, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { 
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export default function TemplatesPage() {
  useThemeContext();
  const navigate = useNavigate();
  const [myTemplates, setMyTemplates] = useState([]);
  const [publicTemplates, setPublicTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Load user's templates and public templates in parallel
      const [myTemplatesResponse, publicTemplatesResponse] = await Promise.all([
        fetch('/api/templates/my-templates', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/templates/public')
      ]);
      
      if (myTemplatesResponse.ok) {
        const myData = await myTemplatesResponse.json();
        setMyTemplates(myData.data || []);
      }
      
      if (publicTemplatesResponse.ok) {
        const publicData = await publicTemplatesResponse.json();
        setPublicTemplates(publicData.data || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/templates/delete/${template.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Template deleted successfully!');
        loadTemplates();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  // Handle template cloning with fields
  const handleUseTemplate = async (template) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/templates/clone/${template.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Template cloned successfully! ${result.data.fieldsCount} fields copied.`, {
          description: `Template "${result.data.name}" has been added to your templates.`,
          duration: 5000,
        });
        
        // Refresh templates list
        loadTemplates();
        
        // Navigate to edit the new template
        navigate(`/template-maker/edit/${result.data.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to clone template');
      }
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Failed to clone template');
    }
  };

  const generatePreviewHTML = (template) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name} - Preview</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        ${template.content_css || ''}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    ${template.content_html || '<div class="text-center p-5"><h2>No content available</h2></div>'}
    <script>
        ${template.content_js || ''}
    </script>
</body>
</html>`;
  };

  const getStatusBadge = (template) => {
    if (!template.is_shared) {
      return <Badge variant="outlined" color="secondary">Private</Badge>;
    }
    
    switch (template.approval_status) {
      case 'pending':
        return <Badge variant="filled" color="warning" className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          Pending Approval
        </Badge>;
      case 'approved':
        return <Badge variant="filled" color="success" className="flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" />
          Approved & Shared
        </Badge>;
      case 'rejected':
        return <Badge variant="filled" color="error" className="flex items-center gap-1">
          <XCircleIcon className="h-3 w-3" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outlined" color="secondary">Private</Badge>;
    }
  };

  const filteredMyTemplates = myTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPublicTemplates = publicTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabs = [
    { key: 'my-templates', label: 'My Templates', count: myTemplates.length },
    { key: 'public-templates', label: 'Community Templates', count: publicTemplates.length }
  ];

  return (
    <Page title="Templates">
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
                    <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Templates
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Create, manage, and discover HTML templates
                    </p>
                  </div>
                </div>

                <Button
                  variant="filled"
                  color="primary"
                  onClick={() => navigate('/template-maker')}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          </div>

          {/* Login Guide */}
          <Card className="mb-6 p-4 border border-blue-200/60 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-900/15">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Login Redirect Guide</h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                  To redirect users to the login page from your templates, add the following to any HTML element:
                </p>
                <code className="block bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-3 py-2 rounded text-sm font-mono">
                  onclick=&quot;Login()&quot;
                </code>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-2">
                  This works on buttons, links, divs, or any clickable element. Perfect for phishing templates!
                </p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 rounded-2xl border border-gray-200/60 bg-white/50 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/30">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white/70 text-primary-700 shadow-soft ring-1 ring-gray-900/5 dark:bg-dark-800/50 dark:text-primary-300 dark:ring-white/10'
                      : 'text-gray-600 hover:bg-white/50 hover:text-gray-900 dark:text-dark-200 dark:hover:bg-dark-800/30 dark:hover:text-dark-50'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="max-w-md"
            />
          </div>

          {/* Templates Grid */}
          {activeTab === 'my-templates' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyTemplates.map((template) => (
                <Card key={template.id} className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/60 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                        {template.thumbnail ? (
                          <img 
                            src={template.thumbnail.startsWith('/') ? template.thumbnail : `/${template.thumbnail}`} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full ${template.thumbnail ? 'hidden' : 'flex'} items-center justify-center`}>
                          <DocumentTextIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <Badge 
                          variant="outlined" 
                          color={template.type === 'phishing' ? 'primary' : 'secondary'}
                        >
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                    {getStatusBadge(template)}
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {template.rejection_reason && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 text-sm">
                        <strong>Rejection reason:</strong> {template.rejection_reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      color="info"
                      onClick={() => handlePreview(template)}
                      className="flex-1"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      color="primary"
                      onClick={() => navigate(`/template-maker/edit/${template.id}`)}
                      className="flex-1"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      color="error"
                      onClick={() => handleDelete(template)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {template.type === 'login' && (
                    <Button
                      variant="filled"
                      size="sm"
                      color="success"
                      onClick={() => navigate(`/templates/fields/${template.id}`)}
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Fields & Realtime
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublicTemplates.map((template) => (
                <Card key={template.id} className="p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/60 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10">
                        {template.thumbnail ? (
                          <img 
                            src={template.thumbnail.startsWith('/') ? template.thumbnail : `/${template.thumbnail}`} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full ${template.thumbnail ? 'hidden' : 'flex'} items-center justify-center`}>
                          <DocumentTextIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <Badge 
                          variant="outlined" 
                          color={template.type === 'phishing' ? 'primary' : 'secondary'}
                        >
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="filled" color="success" className="flex items-center gap-1">
                      <ShareIcon className="h-3 w-3" />
                      Shared
                    </Badge>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>By: {template.created_by_name}</span>
                    <span>•</span>
                    <span>{new Date(template.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      color="info"
                      onClick={() => handlePreview(template)}
                      className="flex-1"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="filled"
                      size="sm"
                      color="primary"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1"
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (
            (activeTab === 'my-templates' && filteredMyTemplates.length === 0) ||
            (activeTab === 'public-templates' && filteredPublicTemplates.length === 0)
          ) && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'my-templates' 
                  ? (searchQuery 
                      ? 'Try adjusting your search criteria.'
                      : 'Get started by creating your first template.'
                    )
                  : (searchQuery
                      ? 'Try adjusting your search criteria.'
                      : 'No community templates are available yet.'
                    )
                }
              </p>
              {activeTab === 'my-templates' && !searchQuery && (
                <Button
                  variant="filled"
                  color="primary"
                  onClick={() => navigate('/template-maker')}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading templates...</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal 
        open={isPreviewModalOpen} 
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Preview: ${selectedTemplate?.name}`}
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedTemplate.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
              </div>
              {getStatusBadge(selectedTemplate)}
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
        )}
      </Modal>
    </Page>
  );
}
