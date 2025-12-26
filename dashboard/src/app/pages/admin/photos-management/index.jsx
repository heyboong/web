import { useState, useEffect, useCallback } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Modal, Badge } from "components/ui";
import { PageHeader, EmptyState, Pagination } from 'components/admin';
import {
  PhotoIcon,
  TrashIcon,
  CloudArrowUpIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function PhotosManagement() {
  // const { isDark } = useThemeContext();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadGender, setUploadGender] = useState('unisex');
  const [filterGender, setFilterGender] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 24;

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const url = filterGender === 'all' 
        ? '/api/admin/id-photos'
        : `/api/admin/id-photos?gender=${filterGender}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(data.data || []);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  }, [filterGender]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    if (files.length > 0) {
      toast.success(`${files.length} files selected`);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('authToken');
      
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });
      formData.append('gender', uploadGender);

      const response = await fetch('/api/admin/id-photos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || `${selectedFiles.length} photos uploaded successfully!`);
        setIsUploadModalOpen(false);
        setSelectedFiles([]);
        loadPhotos();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId, filename) => {
    if (!confirm(`Delete photo "${filename}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/id-photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Photo deleted successfully');
        loadPhotos();
      } else {
        toast.error('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete photo');
    }
  };

  // Pagination
  const indexOfLastPhoto = currentPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos = photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
  const totalPages = Math.ceil(photos.length / photosPerPage);

  return (
    <Page title="Photos Management">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <PageHeader
            title="ID Photos Management"
            description={`Upload and manage ID card photos (${photos.length} total)`}
            icon={PhotoIcon}
            action={
              <Button
                variant="filled"
                color="primary"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                Upload Photos
              </Button>
            }
            stats={[
              { label: 'Total Photos', value: photos.length },
              { label: 'Male', value: photos.filter(p => p.gender === 'male').length },
              { label: 'Female', value: photos.filter(p => p.gender === 'female').length }
            ]}
          />

          {/* Filter */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-4">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium">Filter:</label>
              <div className="flex gap-2">
                {['all', 'male', 'female', 'unisex'].map(gender => (
                  <Button
                    key={gender}
                    size="sm"
                    variant={filterGender === gender ? 'filled' : 'outlined'}
                    onClick={() => setFilterGender(gender)}
                  >
                    {gender === 'all' ? 'Tất cả' : gender === 'male' ? '👨 Nam' : gender === 'female' ? '👩 Nữ' : '👤 Unisex'}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Photos Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : currentPhotos.length === 0 ? (
            <EmptyState
              icon={PhotoIcon}
              title="No photos found"
              description={filterGender !== 'all' ? `No ${filterGender} photos available.` : 'No photos have been uploaded yet.'}
              action={
                <Button variant="filled" color="primary" onClick={() => setIsUploadModalOpen(true)}>
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Photos
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {currentPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden group relative">
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                      <img
                        src={photo.file_url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="filled"
                          color="error"
                          onClick={() => handleDelete(photo.id, photo.filename)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge
                        className="absolute top-2 right-2"
                        color={photo.gender === 'male' ? 'info' : photo.gender === 'female' ? 'secondary' : 'default'}
                        variant="filled"
                      >
                        {photo.gender === 'male' ? '👨' : photo.gender === 'female' ? '👩' : '👤'}
                      </Badge>
                    </div>
                    <div className="p-2 text-xs text-gray-600 dark:text-gray-400 text-center truncate">
                      {photo.filename}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showInfo
                  info={`Page ${currentPage} of ${totalPages}`}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload ID Photos"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Photos *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
                 onClick={() => document.getElementById('photoInput').click()}
            >
              <input
                id="photoInput"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Click to select photos or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG (Max 5MB each)
              </p>
            </div>
            {selectedFiles.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {selectedFiles.length} files selected
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender
            </label>
            <div className="flex gap-2">
              {[
                { value: 'male', label: '👨 Nam' },
                { value: 'female', label: '👩 Nữ' },
                { value: 'unisex', label: '👤 Unisex' }
              ].map(option => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={uploadGender === option.value ? 'filled' : 'outlined'}
                  onClick={() => setUploadGender(option.value)}
                  className="flex-1"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outlined"
              onClick={() => setIsUploadModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Photos`}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

