import { Badge } from 'components/ui';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  NoSymbolIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const statusConfig = {
  active: {
    color: 'success',
    icon: CheckCircleIcon,
    label: 'Active'
  },
  inactive: {
    color: 'neutral',
    icon: XCircleIcon,
    label: 'Inactive'
  },
  suspended: {
    color: 'error',
    icon: NoSymbolIcon,
    label: 'Suspended'
  },
  pending: {
    color: 'warning',
    icon: ClockIcon,
    label: 'Pending'
  },
  draft: {
    color: 'neutral',
    icon: ClockIcon,
    label: 'Draft'
  },
  completed: {
    color: 'success',
    icon: CheckCircleIcon,
    label: 'Completed'
  },
  failed: {
    color: 'error',
    icon: ExclamationTriangleIcon,
    label: 'Failed'
  },
  cancelled: {
    color: 'error',
    icon: XCircleIcon,
    label: 'Cancelled'
  }
};

export function StatusBadge({ status, showIcon = true, className = '' }) {
  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;

  return (
    <Badge color={config.color} className={clsx('inline-flex items-center gap-1.5', className)}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{config.label}</span>
    </Badge>
  );
}
