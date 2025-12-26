import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Textarea, Modal, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { PageHeader, QuickActions, EmptyState } from 'components/admin';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function TemplateApproval() {
  const { isDark } = useThemeContext();
  const [pendingTemplates, setPendingTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingTemplates();
  }, []);

  const loadPendingTemplates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/templates/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingTemplates(data.data || []);
      } else {
        toast.error('Failed to load pending templates');
      }
    } catch (error) {
      console.error('Error loading pending templates:', error);
      toast.error('Failed to load pending templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (templateId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/templates/approve/${templateId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Template approved successfully!');
        loadPendingTemplates();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to approve template');
      }
    } catch (error) {
      console.error('Error approving template:', error);
      toast.error('Failed to approve template');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/templates/reject/${selectedTemplate.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason
        })
      });

      if (response.ok) {
        toast.success('Template rejected successfully!');
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setSelectedTemplate(null);
        loadPendingTemplates();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to reject template');
      }
    } catch (error) {
      console.error('Error rejecting template:', error);
      toast.error('Failed to reject template');
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const generatePreviewHTML = (template) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name} - Approval Preview</title>
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
        // Disable actual navigation for preview
        function Login() {
            alert('Login redirect would happen here (disabled in preview)');
        }
        ${template.content_js || ''}
    </script>
</body>
</html>`;
  };

  return (
    <Page title="Template Approval">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <PageHeader
            title="Template Approval"
            description="Review and approve user-submitted templates for community sharing"
            icon={ClockIcon}
            stats={[
              { label: 'Pending Approval', value: pendingTemplates.length }
            ]}
          />

          {/* Pending Templates */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading pending templates...</p>
            </div>
          ) : pendingTemplates.length === 0 ? (
            <EmptyState
              icon={CheckCircleIcon}
              title="All caught up!"
              description="No templates are currently pending approval."
            />
          ) : (
            <div className="space-y-6">
              {pendingTemplates.map((template) => (
                <Card key={template.id} className={`p-6 hover:shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Template Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {template.thumbnail ? (
                              <img 
                                src={template.thumbnail} 
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
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {template.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outlined" 
                                color={template.type === 'phishing' ? 'primary' : 'secondary'}
                              >
                                {template.type}
                              </Badge>
                              <Badge variant="filled" color="warning">
                                Pending Approval
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {template.description && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Description:</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </div>
                      )}

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Submission Details:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Submitted by: <strong>{template.created_by_name}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>Submitted: {new Date(template.submitted_for_approval_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Template Code Preview */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Code Summary:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className={`p-3 rounded border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-red-600">📄</span>
                              <span className="font-medium">HTML</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                              {template.content_html 
                                ? `${template.content_html.length} characters`
                                : 'No HTML content'
                              }
                            </p>
                          </div>
                          <div className={`p-3 rounded border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-blue-600">🎨</span>
                              <span className="font-medium">CSS</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                              {template.content_css 
                                ? `${template.content_css.length} characters`
                                : 'No CSS content'
                              }
                            </p>
                          </div>
                          <div className={`p-3 rounded border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-yellow-600">⚡</span>
                              <span className="font-medium">JavaScript</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                              {template.content_js 
                                ? `${template.content_js.length} characters`
                                : 'No JS content'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-3 lg:w-48">
                      <QuickActions
                        actions={[
                          { label: 'Preview', icon: EyeIcon, onClick: () => handlePreview(template), color: 'blue' },
                          { label: 'Approve', icon: CheckCircleIcon, onClick: () => handleApprove(template.id), color: 'green' },
                          { label: 'Reject', icon: XCircleIcon, onClick: () => { setSelectedTemplate(template); setIsRejectModalOpen(true); }, color: 'red' }
                        ]}
                      />
                    </div>
                  </div>
                </Card>
              ))}
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
                  Submitted by {selectedTemplate.created_by_name} on {new Date(selectedTemplate.submitted_for_approval_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="filled" color="warning">
                Pending Approval
              </Badge>
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
            
            <div className="flex justify-end gap-3">
              <Button
                variant="filled"
                color="success"
                onClick={() => {
                  handleApprove(selectedTemplate.id);
                  setIsPreviewModalOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Approve Template
              </Button>
              <Button
                variant="filled"
                color="error"
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setIsRejectModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <XCircleIcon className="h-4 w-4" />
                Reject Template
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal 
        open={isRejectModalOpen} 
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectionReason('');
          setSelectedTemplate(null);
        }}
        title={`Reject Template: ${selectedTemplate?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Please provide a reason for rejecting this template. This will help the user understand what needs to be improved.
          </p>
          
          <Textarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this template is being rejected..."
            rows={4}
            required
          />
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outlined"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectionReason('');
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="error"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="flex items-center gap-2"
            >
              <XCircleIcon className="h-4 w-4" />
              Reject Template
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
