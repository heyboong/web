import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import SubscriptionGuard from "components/guards/SubscriptionGuard";
import {
  PhotoIcon,
  ArrowPathIcon,
  UserIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function RandomAnhThe() {
  const { isDark } = useThemeContext();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState('all');

  const fetchPhotos = async (gender = 'all') => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/id-photos/random?gender=${gender}&limit=6`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(data.data || []);
      } else {
        toast.error('Failed to load photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos(selectedGender);
  }, [selectedGender]);

  const handleRefresh = () => {
    fetchPhotos(selectedGender);
    toast.success('Photos refreshed!');
  };

  const handleDownload = async (photoId, photoUrl, filename) => {
    try {
      // Track download
      const token = localStorage.getItem('authToken');
      await fetch(`/api/id-photos/${photoId}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Download file directly (không mở tab mới)
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `id-photo-${photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Photo downloaded!');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Download failed');
    }
  };

  return (
    <SubscriptionGuard>
      <Page title="Random Ảnh Thẻ">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <PhotoIcon className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Random Ảnh Thẻ
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Lấy ngẫu nhiên ảnh thẻ để tạo CCCD, hộ chiếu, v.v.
                    </p>
                  </div>
                </div>
                <Button
                  variant="filled"
                  color="primary"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filter */}
            <Card className="p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Giới tính:
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedGender === 'all' ? 'filled' : 'outlined'}
                    onClick={() => setSelectedGender('all')}
                  >
                    Tất cả
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedGender === 'male' ? 'filled' : 'outlined'}
                    color="info"
                    onClick={() => setSelectedGender('male')}
                  >
                    <UserIcon className="h-4 w-4 mr-1" />
                    Nam
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedGender === 'female' ? 'filled' : 'outlined'}
                    color="secondary"
                    onClick={() => setSelectedGender('female')}
                  >
                    <UserIcon className="h-4 w-4 mr-1" />
                    Nữ
                  </Button>
                </div>
              </div>
            </Card>

            {/* Photos Grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : photos.length === 0 ? (
              <Card className="p-12 text-center">
                <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Không có ảnh thẻ
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Chưa có ảnh thẻ nào cho giới tính này
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden group">
                    <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                      <img
                        src={photo.file_url}
                        alt={`ID Photo ${photo.id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="filled"
                          onClick={() => handleDownload(photo.id, photo.file_url, photo.filename)}
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                          Tải xuống
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          color={photo.gender === 'male' ? 'info' : photo.gender === 'female' ? 'secondary' : 'default'}
                          variant="soft"
                        >
                          {photo.gender === 'male' ? '👨 Nam' : photo.gender === 'female' ? '👩 Nữ' : '👤 Unisex'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {photo.downloads || 0} downloads
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Info */}
            <Card className="p-6 mt-8">
              <div className="flex items-start gap-3">
                <PhotoIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cách sử dụng
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Click <strong>Refresh</strong> để lấy 6 ảnh thẻ ngẫu nhiên mới</li>
                    <li>• Chọn <strong>Giới tính</strong> để lọc ảnh theo nam/nữ</li>
                    <li>• Hover vào ảnh và click <strong>Tải xuống</strong> để download</li>
                    <li>• Sử dụng ảnh cho tool <strong>Tạo CCCD</strong>, hộ chiếu, v.v.</li>
                    <li>• Ảnh thẻ chuẩn 3x4, chất lượng cao</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Page>
    </SubscriptionGuard>
  );
}

