import { useState, useRef } from 'react';
import { Upload } from './Form/Upload';
import { PreviewImg } from 'components/shared/PreviewImg';
import { Button } from './Button';
import { 
  PhotoIcon, 
  XMarkIcon,
  CloudArrowUpIcon 
} from '@heroicons/react/24/outline';
import { useThemeContext } from 'app/contexts/theme/context';

export function ImageUpload({ 
  value = '', 
  onChange = () => {}, 
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
  disabled = false,
  placeholder = 'Click to upload image'
}) {
  const { isDark } = useThemeContext();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef();

  const handleFileSelect = (file) => {
    if (!file) return;

    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setPreviewFile(file);
    
    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreviewFile(null);
    onChange('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
          ${dragActive 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : isDark 
              ? 'border-gray-600 hover:border-gray-500' 
              : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload
          onChange={handleFileSelect}
          accept={accept}
          disabled={disabled}
        >
          {({ onClick }) => (
            <div 
              className="flex flex-col items-center justify-center text-center"
              onClick={disabled ? undefined : onClick}
            >
              {previewFile || value ? (
                <div className="relative w-full max-w-xs">
                  <div className="relative group">
                    <PreviewImg
                      file={previewFile}
                      src={value}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove();
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {previewFile ? previewFile.name : 'Image uploaded'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className={`
                    p-4 rounded-full mb-4
                    ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
                  `}>
                    <CloudArrowUpIcon className={`
                      h-8 w-8 
                      ${isDark ? 'text-gray-400' : 'text-gray-500'}
                    `} />
                  </div>
                  <p className={`
                    text-lg font-medium mb-2
                    ${isDark ? 'text-gray-300' : 'text-gray-700'}
                  `}>
                    {placeholder}
                  </p>
                  <p className={`
                    text-sm mb-4
                    ${isDark ? 'text-gray-400' : 'text-gray-500'}
                  `}>
                    Drag and drop or click to browse
                  </p>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="sm"
                    disabled={disabled}
                  >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          )}
        </Upload>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
      
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Supported formats: JPG, PNG, GIF, WebP. Max size: {Math.round(maxSize / 1024 / 1024)}MB
      </p>
    </div>
  );
}
