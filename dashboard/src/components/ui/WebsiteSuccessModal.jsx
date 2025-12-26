import { useState } from 'react';
import { Modal, Button, Input } from './index';
import { 
  ClipboardDocumentIcon, 
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function WebsiteSuccessModal({ 
  isOpen, 
  onClose, 
  websiteData = null
}) {
  const [copiedField, setCopiedField] = useState(null);

  if (!websiteData) return null;

  // Use selected domain if available, otherwise fallback to current origin
  const baseUrl = websiteData.domain && websiteData.domain.trim() !== '' 
    ? `https://${websiteData.domain}` 
    : window.location.origin;
  
  const websiteUrl = `${baseUrl}/${websiteData.slug}`;
  const adminUrl = `${window.location.origin}/phishing/manage/${websiteData.id}`;

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const openInNewTab = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
            <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Website Created Successfully! 🎉
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your phishing website is ready to use
            </p>
          </div>
        </div>

        {/* Website Info */}
        <div className="space-y-4 mb-6">
          {/* Website Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website Title
            </label>
            <div className="flex gap-2">
              <Input
                value={websiteData.title}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outlined"
                size="sm"
                onClick={() => copyToClipboard(websiteData.title, 'Title')}
                className="px-3"
              >
                {copiedField === 'Title' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phishing Website URL
            </label>
            <div className="flex gap-2">
              <Input
                value={websiteUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outlined"
                size="sm"
                onClick={() => copyToClipboard(websiteUrl, 'Website URL')}
                className="px-3"
              >
                {copiedField === 'Website URL' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => openInNewTab(websiteUrl)}
                className="px-3"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website Slug
            </label>
            <div className="flex gap-2">
              <Input
                value={websiteData.slug}
                readOnly
                className="flex-1 font-mono"
              />
              <Button
                variant="outlined"
                size="sm"
                onClick={() => copyToClipboard(websiteData.slug, 'Slug')}
                className="px-3"
              >
                {copiedField === 'Slug' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Admin URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin/Management URL
            </label>
            <div className="flex gap-2">
              <Input
                value={adminUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outlined"
                size="sm"
                onClick={() => copyToClipboard(adminUrl, 'Admin URL')}
                className="px-3"
              >
                {copiedField === 'Admin URL' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => openInNewTab(adminUrl)}
                className="px-3"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🚀 Quick Actions
          </h4>
          <div className="space-y-2 text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              • Copy the phishing URL and share it with your targets
            </p>
            <p className="text-blue-800 dark:text-blue-200">
              • Use the admin URL to view captured credentials
            </p>
            <p className="text-blue-800 dark:text-blue-200">
              • Test the website before deployment
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="filled"
            color="primary"
            onClick={() => copyToClipboard(websiteUrl, 'Website URL')}
            className="flex-1"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Copy Phishing URL
          </Button>
          <Button
            variant="outlined"
            onClick={() => openInNewTab(websiteUrl)}
            className="flex-1"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
            Preview Website
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            className="flex-1"
          >
            Create Another
          </Button>
        </div>
      </div>
    </Modal>
  );
}
