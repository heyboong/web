// Import Dependencies
import { useState } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

// Local Imports
import clsx from 'clsx';

// ----------------------------------------------------------------------

export function BalanceDisplay({ 
  className,
  showIcon = true,
  size = 'sm'
}) {
  const [balance] = useState(0);
  const [isLoading] = useState(false);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (isLoading) {
    return (
      <div className={clsx("flex items-center space-x-2", className)}>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-16"></div>
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center space-x-2", className)}>
      {showIcon && (
        <CurrencyDollarIcon className={clsx("text-green-600 dark:text-green-400", iconSizes[size])} />
      )}
      <span className={clsx("font-medium text-gray-900 dark:text-white", sizeClasses[size])}>
        ${balance.toFixed(2)}
      </span>
      {/* Top up link removed as topup feature has been disabled */}
    </div>
  );
}

BalanceDisplay.propTypes = {
  className: PropTypes.string,
  showIcon: PropTypes.bool,
  showLink: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};
