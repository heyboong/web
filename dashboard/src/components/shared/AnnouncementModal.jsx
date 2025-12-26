import { useState, useEffect } from 'react';
import { Modal, Button } from 'components/ui';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY = 'announcement_dismissed';
const HOURS_12 = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    try {
      setLoading(true);
      
      // Check if announcement was dismissed within last 12 hours
      const dismissedData = localStorage.getItem(STORAGE_KEY);
      if (dismissedData) {
        const { timestamp } = JSON.parse(dismissedData);
        const now = new Date().getTime();
        if (now - timestamp < HOURS_12) {
          // Still within 12 hours, don't show
          setLoading(false);
          return;
        }
      }

      // Load announcement from API
      const response = await fetch('/api/system-announcement');
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const data = result.data;
          
          // Only show if active
          if (data.is_active) {
            setAnnouncement(data);
            setIsOpen(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCloseFor12Hours = () => {
    // Save dismiss timestamp to localStorage
    const dismissData = {
      timestamp: new Date().getTime()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissData));
    setIsOpen(false);
  };

  if (loading || !announcement) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={announcement.title}
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-6">
        {/* Announcement Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outlined"
            onClick={handleClose}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Close
          </Button>
          <Button
            color="primary"
            onClick={handleCloseFor12Hours}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <ClockIcon className="h-4 w-4" />
            Do not show for 12 hours
          </Button>
        </div>

        {/* Small note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          You can view this announcement again by refreshing the page after the time expires.
        </p>
      </div>
    </Modal>
  );
}

