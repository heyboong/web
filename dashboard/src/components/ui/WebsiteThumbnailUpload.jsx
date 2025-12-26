import { useState, useRef } from 'react';
import { Button } from './Button';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function WebsiteThumbnailUpload({ 
  value, 
  onChange, 
  placeholder = "Upload website thumbnail",
  className = "",
  accept = "image/*",
  maxSize = 5 * 1024 * 1024 // 5MB
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/upload/website-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📸 Upload response:', data);
        
        // Use the filePath returned from server
        const thumbnailUrl = data.filePath;
        setPreview(thumbnailUrl);
        onChange(thumbnailUrl);
        
        toast.success('Thumbnail uploaded successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to upload thumbnail');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {preview ? (
        <div className="relative group">
          <img
            src={preview.startsWith('/') ? preview : `/${preview}`}
            alt="Website thumbnail"
            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                variant="filled"
                color="primary"
                size="sm"
                onClick={handleClick}
                disabled={isUploading}
              >
                <PhotoIcon className="h-4 w-4 mr-1" />
                Change
              </Button>
              <Button
                variant="filled"
                color="error"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`
            w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 
            rounded-lg flex flex-col items-center justify-center cursor-pointer
            hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10
            transition-colors
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-center">
            {isUploading ? 'Uploading...' : placeholder}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Click to upload image (max {Math.round(maxSize / 1024 / 1024)}MB)
          </p>
        </div>
      )}
      
      {isUploading && (
        <div className="mt-2">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full animate-pulse w-1/2"></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Uploading thumbnail...
          </p>
        </div>
      )}
    </div>
  );
}
