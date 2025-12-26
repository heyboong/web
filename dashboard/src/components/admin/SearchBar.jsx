import { useState, useEffect, useCallback } from 'react';
import { Input } from 'components/ui';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  debounce = 300,
  onClear,
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState(value || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange) {
        onChange(searchTerm);
      }
    }, debounce);

    return () => clearTimeout(timer);
  }, [searchTerm, debounce, onChange]);

  // Update internal state when external value changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange('');
    }
  }, [onClear, onChange]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-indigo-500" />
      </div>
      
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="admin-input pl-10 pr-10"
      />
      
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
