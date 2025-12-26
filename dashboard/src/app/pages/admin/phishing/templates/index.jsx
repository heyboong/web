import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Textarea, Select, Modal, ImageUpload, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { PageHeader, SearchBar, FilterBadgeGroup, EmptyState, QuickActions } from "components/admin";
import { 
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function TemplateManagement() {
  const { isDark } = useThemeContext();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnail: '',
    type: 'phishing',
    content_html: '',
    content_css: '',
    content_js: '',
    is_active: true
  });

  const templateTypes = [
    { value: 'phishing', label: 'Phishing Template' },
    { value: 'login', label: 'Login Page Template' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Admin templates loaded:', data.data?.map(t => ({ id: t.id, name: t.name, thumbnail: t.thumbnail })));
        
        // Check for duplicate IDs
        const ids = data.data?.map(t => t.id) || [];
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
          console.warn('Duplicate template IDs detected:', duplicateIds);
        }
        
        setTemplates(data.data || []);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Template name is required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const url = selectedTemplate 
        ? `/api/admin/templates/${selectedTemplate.id}`
        : '/api/admin/templates';
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(selectedTemplate ? 'Template updated successfully!' : 'Template created successfully!');
        loadTemplates();
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      thumbnail: template.thumbnail || '',
      type: template.type,
      content_html: template.content_html || '',
      content_css: template.content_css || '',
      content_js: template.content_js || '',
      is_active: template.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/templates/${template.id}`, {
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
        toast.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      thumbnail: '',
      type: 'phishing',
      content_html: '',
      content_css: '',
      content_js: '',
      is_active: true
    });
    setSelectedTemplate(null);
    setIsModalOpen(false);
    setIsEditModalOpen(false);
  };

  const filteredTemplates = templates
    .filter((template, index, self) => {
      // Remove duplicates based on ID
      return index === self.findIndex(t => t.id === template.id);
    })
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || template.type === filterType;
      return matchesSearch && matchesType;
    });

  return (
    <Page title="Template Management">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <PageHeader
            title="Template Management"
            description="Manage phishing and login page templates"
            icon={DocumentTextIcon}
            action={
              <Button
                variant="filled"
                color="primary"
                onClick={() => setIsModalOpen(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            }
            stats={[
              { label: 'Total Templates', value: templates.length },
              { label: 'Active', value: templates.filter(t => t.is_active).length },
              { label: 'Phishing', value: templates.filter(t => t.type === 'phishing').length }
            ]}
          />

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search templates..."
                className="max-w-md"
              />
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                data={[
                  { value: 'all', label: 'All Types' },
                  { value: 'phishing', label: 'Phishing Templates' },
                  { value: 'login', label: 'Login Templates' }
                ]}
                className="max-w-xs"
              />
            </div>
            <FilterBadgeGroup
              filters={[
                searchQuery && { label: `Search: ${searchQuery}`, onRemove: () => setSearchQuery('') },
                filterType !== 'all' && { label: `Type: ${filterType}`, onRemove: () => setFilterType('all') }
              ].filter(Boolean)}
            />
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <Card key={`template-${template.id}-${index}`} className={`p-6 hover:shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {template.thumbnail && template.thumbnail.trim() !== '' && template.thumbnail !== 'null' ? (
                        <>
                          <img 
                            src={template.thumbnail.startsWith('/') ? template.thumbnail : `/${template.thumbnail}`} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                            style={{ display: 'block' }}
                            onLoad={() => {
                              console.log('Admin template image loaded successfully:', template.thumbnail);
                            }}
                            onError={(e) => {
                              console.log('Admin template image failed to load:', template.thumbnail);
                              e.target.style.display = 'none';
                              const fallback = e.target.parentNode.querySelector('.fallback-icon');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="fallback-icon w-full h-full hidden items-center justify-center">
                            <DocumentTextIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <DocumentTextIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
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
                  <Badge 
                    variant={template.is_active ? 'filled' : 'outlined'}
                    color={template.is_active ? 'success' : 'error'}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                </div>

                <QuickActions
                  actions={[
                    { label: 'Edit', icon: PencilIcon, onClick: () => handleEdit(template), color: 'blue' },
                    { label: 'Delete', icon: TrashIcon, onClick: () => handleDelete(template), color: 'red' }
                  ]}
                />
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && !isLoading && (
            <EmptyState
              icon={DocumentTextIcon}
              title="No templates found"
              description={
                searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first template.'
              }
              action={
                !searchQuery && filterType === 'all' && (
                  <Button variant="filled" color="primary" onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                )
              }
            />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={isModalOpen || isEditModalOpen} onClose={resetForm}>
        <div className="p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {selectedTemplate ? 'Edit Template' : 'Create New Template'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter template name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Type *
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  data={templateTypes}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter template description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Thumbnail
              </label>
              <ImageUpload
                value={formData.thumbnail}
                onChange={(value) => handleInputChange('thumbnail', value)}
                placeholder="Upload template thumbnail"
                accept="image/*"
                maxSize={5 * 1024 * 1024}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                HTML Content
              </label>
              <Textarea
                value={formData.content_html}
                onChange={(e) => handleInputChange('content_html', e.target.value)}
                placeholder="Enter HTML content"
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CSS Content
                </label>
                <Textarea
                  value={formData.content_css}
                  onChange={(e) => handleInputChange('content_css', e.target.value)}
                  placeholder="Enter CSS content"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  JavaScript Content
                </label>
                <Textarea
                  value={formData.content_js}
                  onChange={(e) => handleInputChange('content_js', e.target.value)}
                  placeholder="Enter JavaScript content"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Template
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outlined"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                color="primary"
              >
                {selectedTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </Page>
  );
}
