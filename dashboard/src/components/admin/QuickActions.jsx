import { Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export function QuickActions({ actions = [] }) {
  return (
    <Menu as="div" className="relative inline-block text-left admin-quick-actions">
      <MenuButton
        aria-label="Open quick actions"
        className="admin-quick-trigger"
      >
        <span className="sr-only">Open quick actions</span>
        <EllipsisVerticalIcon className="h-5 w-5" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="admin-quick-menu">
          <div className="py-1">
            {actions.map((action, index) => (
              <MenuItem key={index}>
                {({ focus }) => (
                  <button
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={clsx(
                      'admin-quick-item',
                      focus && !action.disabled && 'is-active',
                      action.disabled && 'is-disabled',
                      action.danger && 'is-danger'
                    )}
                  >
                    {action.icon && (
                      <action.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                    )}
                    <span>{action.label}</span>
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
