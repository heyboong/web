import { Button } from 'components/ui';

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  className = '' 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4">
          {Icon && <Icon className="h-12 w-12 text-gray-400 dark:text-gray-600" />}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
