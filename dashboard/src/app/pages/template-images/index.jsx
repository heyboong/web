import { useState, useEffect, useCallback } from 'react';
import { Page } from "components/shared/Page";
import { Button, Input, Modal } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { 
  PhotoIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import axios from 'utils/axios';

export default function TemplateImages() {
  const { isDark } = useThemeContext();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/template-images');
      if (response.data.status === 'success') {
        setImages(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load images on component mount
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 10MB)`);
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('/api/template-images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.status === 'success') {
          toast.success(`${file.name} uploaded successfully`);
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Upload failed');
        }
      } catch (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result !== null);
    
    if (successfulUploads.length > 0) {
      loadImages(); // Reload images
    }
    
    setUploading(false);
  }, [loadImages]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = (e) => {
    handleFileUpload(e.target.files);
  };

  const deleteImage = useCallback(async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await axios.delete(`/api/template-images/${imageId}`);
      if (response.data.status === 'success') {
        toast.success('Image deleted successfully');
        loadImages();
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      toast.error(`Failed to delete image: ${error.message}`);
    }
  }, [loadImages]);

  const renameImage = useCallback(async () => {
    if (!selectedImage || !newName.trim()) return;

    try {
      const response = await axios.put(`/api/template-images/${selectedImage.id}/rename`, {
        newName: newName.trim()
      });
      
      if (response.data.status === 'success') {
        toast.success('Image renamed successfully');
        setIsRenameOpen(false);
        setNewName('');
        setSelectedImage(null);
        loadImages();
      } else {
        throw new Error(response.data.message || 'Rename failed');
      }
    } catch (error) {
      toast.error(`Failed to rename image: ${error.message}`);
    }
  }, [selectedImage, newName, loadImages]);

  const copyImageUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Image URL copied to clipboard');
    });
  };

  const openPreview = (image) => {
    setSelectedImage(image);
    setIsPreviewOpen(true);
  };

  const openRename = (image) => {
    setSelectedImage(image);
    setNewName(image.originalName || image.filename.replace(/\.[^/.]+$/, ""));
    setIsRenameOpen(true);
  };

  // Filter images based on search term
  const filteredImages = images.filter(image => 
    image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Page title="Template Images Gallery">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-500/20">
                  <PhotoIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Template Images Gallery
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Upload and manage images for your templates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <label htmlFor="file-upload">
                  <Button
                    as="span"
                    color="primary"
                    variant="filled"
                    disabled={uploading}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <CloudArrowUpIcon className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Images'}
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Upload Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop images here to upload
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Or click the upload button above. Supports JPG, PNG, GIF, WebP, SVG (max 10MB each)
              </p>
            </div>

            {/* Images Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredImages.map((image) => (
                  <div
                    key={image.filename}
                    className={`group relative rounded-lg overflow-hidden border ${
                      isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    } hover:shadow-lg transition-shadow`}
                  >
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPreview(image)}
                      className="text-white hover:bg-white/20"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyImageUrl(image.url)}
                      className="text-white hover:bg-white/20"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openRename(image)}
                      className="text-white hover:bg-white/20"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteImage(image.id)}
                      className="text-white hover:bg-red-500/20"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Image info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {image.originalName || image.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(image.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

            {/* Empty state */}
            {!loading && filteredImages.length === 0 && (
              <div className="text-center py-12">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No images found' : 'No images uploaded yet'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Upload your first image to get started'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Image Preview"
        size="lg"
      >
        {selectedImage && (
          <div className="space-y-4">
            <div className="text-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Filename:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedImage.filename}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Size:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(selectedImage.size)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Uploaded:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(selectedImage.uploadedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => copyImageUrl(selectedImage.url)}
              >
                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPreviewOpen(false);
                  openRename(selectedImage);
                }}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Rename
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setIsPreviewOpen(false);
                  deleteImage(selectedImage.id);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Rename Modal */}
      <Modal
        open={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        title="Rename Image"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              New filename (without extension):
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new filename"
              autoFocus
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={renameImage}
              disabled={!newName.trim()}
            >
              Rename
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
