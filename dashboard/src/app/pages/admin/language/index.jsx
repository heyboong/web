import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Textarea, Select, Modal, Badge } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { useThemeContext } from "app/contexts/theme/context";
import { PageHeader } from "components/admin";
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { locales } from 'i18n/langs';

export default function LanguageManagement() {
  const { isAdmin } = useAuthContext();
  const { isDark } = useThemeContext();
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isViewingTranslations, setIsViewingTranslations] = useState(false);
  const [editingTranslations, setEditingTranslations] = useState({});
  const [isSavingTranslations, setIsSavingTranslations] = useState(false);
  const [isAddingTranslation, setIsAddingTranslation] = useState(false);
  const [newTranslationKey, setNewTranslationKey] = useState('');
  const [newTranslationValue, setNewTranslationValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nativeName: '',
    flag: '',
    isActive: true,
    isRTL: false
  });

  // Load available languages from i18n config
  useEffect(() => {
    const loadLanguages = async () => {
      if (!isAdmin) {
        toast.error('Access Denied', {
          description: 'You do not have permission to access this page.',
          duration: 4000,
        });
        window.location.href = '/dashboards/home';
        return;
      }

      try {
        setIsLoading(true);
        // Load languages from the existing i18n configuration
        const availableLanguages = Object.keys(locales).map(code => ({
          code,
          name: locales[code].label,
          nativeName: locales[code].label,
          flag: locales[code].flag,
          isActive: true,
          isRTL: code === 'ar'
        }));
        
        setLanguages(availableLanguages);
      } catch (error) {
        console.error('Error loading languages:', error);
        toast.error('Failed to load languages');
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, [isAdmin]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddLanguage = () => {
    setEditingLanguage(null);
    setIsEditing(false);
    setFormData({
      code: '',
      name: '',
      nativeName: '',
      flag: '',
      isActive: true,
      isRTL: false
    });
    setIsModalOpen(true);
  };

  const handleEditLanguage = (language) => {
    setEditingLanguage(language);
    setIsEditing(true);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      flag: language.flag,
      isActive: language.isActive,
      isRTL: language.isRTL
    });
    setIsModalOpen(true);
  };

  const handleDeleteLanguage = async (languageCode) => {
    if (window.confirm(`Are you sure you want to delete the language "${languageCode}"?`)) {
      try {
        // Remove from languages array
        setLanguages(prev => prev.filter(lang => lang.code !== languageCode));
        toast.success('Language deleted successfully');
      } catch (error) {
        console.error('Error deleting language:', error);
        toast.error('Failed to delete language');
      }
    }
  };

  const handleSaveLanguage = async () => {
    try {
      if (isEditing) {
        // Update existing language
        setLanguages(prev => prev.map(lang => 
          lang.code === editingLanguage.code 
            ? { ...formData, code: editingLanguage.code }
            : lang
        ));
        toast.success('Language updated successfully');
      } else {
        // Add new language
        const newLanguage = {
          ...formData,
          code: formData.code.toLowerCase()
        };
        setLanguages(prev => [...prev, newLanguage]);
        toast.success('Language added successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving language:', error);
      toast.error('Failed to save language');
    }
  };

  const handleViewTranslations = async (language) => {
    try {
      setSelectedLanguage(language);
      setIsLoading(true);
      
      console.log('🔍 Loading translations for language:', language.code);
      
      // Load translations for the selected language
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/languages/${language.code}/translations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 API response data:', data);
        console.log('🔍 Translations loaded:', Object.keys(data.data?.translations || {}).length);
        console.log('🔍 Sample loaded translations:', Object.entries(data.data?.translations || {}).slice(0, 3));
        setEditingTranslations(data.data?.translations || {});
      } else {
        console.log('❌ API response not ok, starting with empty translations');
        console.log('❌ Response status:', response.status);
        console.log('❌ Response text:', await response.text());
        // If no translations exist, start with empty object
        setEditingTranslations({});
      }
      
      setIsViewingTranslations(true);
    } catch (error) {
      console.error('❌ Error loading translations:', error);
      toast.error('Failed to load translations');
      setEditingTranslations({});
      setIsViewingTranslations(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslationChange = (key, value) => {
    setEditingTranslations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddTranslation = () => {
    if (newTranslationKey.trim() && newTranslationValue.trim()) {
      setEditingTranslations(prev => ({
        ...prev,
        [newTranslationKey.trim()]: newTranslationValue.trim()
      }));
      setNewTranslationKey('');
      setNewTranslationValue('');
      setIsAddingTranslation(false);
      toast.success('Translation added successfully');
    } else {
      toast.error('Please fill in both key and value');
    }
  };

  const handleRemoveTranslation = (key) => {
    setEditingTranslations(prev => {
      const newTranslations = { ...prev };
      delete newTranslations[key];
      return newTranslations;
    });
    toast.success('Translation removed');
  };

  const handleSaveTranslations = async () => {
    try {
      setIsSavingTranslations(true);
      
      // Debug: Log what we're about to save
      console.log('🔍 About to save translations for:', selectedLanguage.code);
      console.log('🔍 Current editingTranslations:', editingTranslations);
      console.log('🔍 Number of translations to save:', Object.keys(editingTranslations).length);
      
      // Safety check: Don't save if translations object is empty
      if (!editingTranslations || Object.keys(editingTranslations).length === 0) {
        console.error('❌ Cannot save: translations object is empty!');
        toast.error('Cannot save: No translations to save. Please load translations first.');
        return;
      }
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/languages/${selectedLanguage.code}/translations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations: editingTranslations })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Save successful:', result);
        toast.success('Translations saved successfully');
      } else {
        const errorData = await response.text();
        console.error('❌ Save failed:', response.status, errorData);
        throw new Error(`Failed to save translations: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error saving translations:', error);
      toast.error('Failed to save translations');
    } finally {
      setIsSavingTranslations(false);
    }
  };

  const handleExportTranslations = async (language) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/languages/${language.code}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${language.code}_translations.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Translations exported successfully');
      } else {
        throw new Error('Failed to export translations');
      }
    } catch (error) {
      console.error('Error exporting translations:', error);
      toast.error('Failed to export translations');
    }
  };


  const renderTranslationEditor = () => {
    const translationKeys = Object.keys(editingTranslations);
    
    // Filter translations based on search query
    const filteredTranslations = translationKeys.filter(key => 
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (editingTranslations[key] && editingTranslations[key].toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Edit Translations for {selectedLanguage?.name}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              color="success"
              onClick={() => setIsAddingTranslation(true)}
            >
              Add Translation
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={handleSaveTranslations}
              disabled={isSavingTranslations}
            >
              {isSavingTranslations ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setIsViewingTranslations(false)}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Search Translations */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Translations
              </label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by key or translation value..."
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              {filteredTranslations.length} of {translationKeys.length} translations
            </div>
          </div>
        </div>

        {/* Add New Translation Form */}
        {isAddingTranslation && (
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
            <h4 className={`text-md font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Add New Translation</h4>
            <div className="flex gap-4 items-start">
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Translation Key
                </label>
                <Input
                  value={newTranslationKey}
                  onChange={(e) => setNewTranslationKey(e.target.value)}
                  placeholder="e.g., nav.admin.newFeature"
                />
              </div>
              <div className="w-2/3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Translation Value
                </label>
                <Input
                  value={newTranslationValue}
                  onChange={(e) => setNewTranslationValue(e.target.value)}
                  placeholder="Enter translation value"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="filled"
                color="success"
                onClick={handleAddTranslation}
                size="sm"
              >
                Add Translation
              </Button>
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => {
                  setIsAddingTranslation(false);
                  setNewTranslationKey('');
                  setNewTranslationValue('');
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
          {filteredTranslations.map(key => (
            <div key={key} className={`flex gap-4 items-start p-3 rounded-lg ${isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {key}
                </label>
                <Input
                  value={key}
                  disabled
                  className={isDark ? 'bg-gray-600' : 'bg-gray-100'}
                />
              </div>
              <div className="w-2/3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Translation
                </label>
                <Textarea
                  value={editingTranslations[key] || ''}
                  onChange={(e) => handleTranslationChange(key, e.target.value)}
                  rows={2}
                  placeholder="Enter translation..."
                />
              </div>
              <div className="w-20 flex items-end">
                <Button
                  variant="outlined"
                  color="error"
                  size="sm"
                  onClick={() => handleRemoveTranslation(key)}
                  className="px-2 py-1"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredTranslations.length === 0 && translationKeys.length > 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No translations match your search. Try a different search term.
          </div>
        )}
        
        {translationKeys.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No translations found. Add some translations to get started.
          </div>
        )}
      </div>
    );
  };

  if (isLoading && !isViewingTranslations) {
    return (
      <Page title="Language Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  if (isViewingTranslations) {
    return (
      <Page title={`Translations - ${selectedLanguage?.name}`}>
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                    <LanguageIcon className={`h-6 w-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Translations - {selectedLanguage?.name}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Manage translations for {selectedLanguage?.name} ({selectedLanguage?.code})
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card className={`p-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              {renderTranslationEditor()}
            </Card>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Language Management">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <PageHeader
            title="Language Management"
            description="Manage languages and translations for your application"
            icon={LanguageIcon}
            action={
              <Button
                variant="filled"
                color="primary"
                onClick={handleAddLanguage}
                className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4" />
                Add Language
              </Button>
            }
            stats={[
              { label: 'Total Languages', value: languages.length },
              { label: 'Active', value: languages.filter(l => l.isActive).length }
            ]}
          />

          {/* Languages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {languages.map((language) => (
              <Card key={language.code} className={`p-6 hover:shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-2xl">
                        {language.flag === 'united-kingdom' ? '🇬🇧' : 
                         language.flag === 'saudi' ? '🇸🇦' : 
                         language.flag === 'spain' ? '🇪🇸' : 
                         language.flag === 'china' ? '🇨🇳' : '🌐'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {language.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language.nativeName}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={language.isActive ? "filled" : "outlined"}
                    color={language.isActive ? "success" : "neutral"}
                    className="text-xs"
                  >
                    {language.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Code:</span>
                    <Badge variant="outlined" className="text-xs">
                      {language.code.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Direction:</span>
                    <Badge variant="outlined" className="text-xs">
                      {language.isRTL ? 'RTL' : 'LTR'}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      color="info"
                      onClick={() => handleViewTranslations(language)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <EyeIcon className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      color="secondary"
                      onClick={() => handleEditLanguage(language)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      color="warning"
                      onClick={() => handleExportTranslations(language)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3" />
                      Export
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      color="error"
                      onClick={() => handleDeleteLanguage(language.code)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <TrashIcon className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add/Edit Language Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditing ? 'Edit Language' : 'Add New Language'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language Code *
                </label>
                <Input
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., en, es, ar"
                  disabled={isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., English, Spanish"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Native Name
                </label>
                <Input
                  name="nativeName"
                  value={formData.nativeName}
                  onChange={handleInputChange}
                  placeholder="e.g., English, Español"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flag
                </label>
                <Select
                  name="flag"
                  value={formData.flag}
                  onChange={handleInputChange}
                >
                  <option value="">Select Flag</option>
                  <option value="united-kingdom">🇬🇧 United Kingdom</option>
                  <option value="saudi">🇸🇦 Saudi Arabia</option>
                  <option value="spain">🇪🇸 Spain</option>
                  <option value="china">🇨🇳 China</option>
                  <option value="france">🇫🇷 France</option>
                  <option value="germany">🇩🇪 Germany</option>
                  <option value="japan">🇯🇵 Japan</option>
                  <option value="korea">🇰🇷 Korea</option>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Active
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isRTL"
                  checked={formData.isRTL}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Right-to-Left (RTL)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={handleSaveLanguage}
              disabled={!formData.code || !formData.name}
            >
              {isEditing ? 'Update' : 'Add'} Language
            </Button>
          </div>
        </Modal>
        </div>
      </div>
    </Page>
  );
}
