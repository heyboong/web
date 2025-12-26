import { XMarkIcon } from '@heroicons/react/24/outline';

export function FilterBadge({ label, value, onRemove }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800">
      <span className="text-xs font-normal text-blue-600 dark:text-blue-400">
        {label}:
      </span>
      <span>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function FilterBadgeGroup({ filters, onRemoveFilter, onClearAll }) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Active Filters:
      </span>
      {filters.map((filter, index) => (
        <FilterBadge
          key={index}
          label={filter.label}
          value={filter.value}
          onRemove={() => onRemoveFilter(filter.key)}
        />
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
