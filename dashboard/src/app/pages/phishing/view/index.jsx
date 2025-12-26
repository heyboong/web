import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Page } from "components/shared/Page";
import { Card, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { 
  GlobeAltIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const PhishingView = () => {
  const { slug } = useParams();
  const { isDark } = useThemeContext();
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWebsite = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!slug) {
          setError('Invalid website slug');
          return;
        }
        
        const response = await fetch(`/api/phishing/website/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Website not found');
          } else {
            setError('Failed to load website');
          }
          return;
        }
        
        const data = await response.json();
        
        if (data && data.status === 'success' && data.data) {
          setWebsite(data.data);
        } else {
          setError(data?.message || 'Website not found');
        }
      } catch (err) {
        setError('Failed to load website');
        console.error('Error fetching website:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchWebsite();
    } else {
      setError('No website slug provided');
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <Page title="Loading...">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Error">
        <div className="flex items-center justify-center min-h-screen">
          <Card className={`p-6 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  if (!website) {
    return (
      <Page title="Not Found">
        <div className="flex items-center justify-center min-h-screen">
          <Card className={`p-6 ${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Website Not Found</h2>
              <p className="text-yellow-600 dark:text-yellow-300">The requested website could not be found.</p>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  // Render the phishing page content
  return (
    <Page title={website?.title || 'Website'}>
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Website Info */}
          <Card className={`p-6 mb-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <GlobeAltIcon className="h-6 w-6 text-gray-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {website?.title || 'Untitled Website'}
              </h1>
            </div>
            
            {website?.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {website.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                <span>{website?.view_count || 0} views</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>
                  {website?.created_at ? new Date(website.created_at).toLocaleDateString() : 'Unknown date'}
                </span>
              </div>
              {website?.language && (
                <Badge variant="outlined" color="primary">
                  {website.language}
                </Badge>
              )}
            </div>
          </Card>

          {/* Website Content */}
          <Card className={`p-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: website?.temp1 || website?.html_content || '<p>No content available</p>' 
              }} 
            />
          </Card>
        </div>
      </div>
    </Page>
  );
};

export default PhishingView;
