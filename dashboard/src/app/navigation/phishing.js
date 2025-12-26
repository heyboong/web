import { 
  GlobeAltIcon,
  PlusIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from 'constants/app.constant'

const ROOT_PHISHING = '/phishing'

const path = (root, item) => `${root}${item}`;

export const phishing = {
    id: 'phishing',
    type: NAV_TYPE_ROOT,
    path: '/phishing',
    title: 'Phishing',
    transKey: 'nav.phishing.phishing',
    Icon: GlobeAltIcon,
    childs: [
        {
            id: 'phishing.dashboard',
            path: path(ROOT_PHISHING, '/dashboard'),
            type: NAV_TYPE_ITEM,
            title: 'Realtime Dashboard',
            transKey: 'nav.phishing.dashboard',
            Icon: ChartBarIcon,
        },
        {
            id: 'phishing.create',
            path: path(ROOT_PHISHING, '/create'),
            type: NAV_TYPE_ITEM,
            title: 'Create Website',
            transKey: 'nav.phishing.create',
            Icon: PlusIcon,
        },
        {
            id: 'phishing.manage',
            path: path(ROOT_PHISHING, '/manage'),
            type: NAV_TYPE_ITEM,
            title: 'Website Manage',
            transKey: 'nav.phishing.manage',
            Icon: Cog6ToothIcon,
        },
        {
            id: 'phishing.accounts',
            path: path(ROOT_PHISHING, '/accounts'),
            type: NAV_TYPE_ITEM,
            title: 'Manage Accounts',
            transKey: 'nav.phishing.accounts',
            Icon: UsersIcon,
        },
        {
            id: 'phishing.telegram',
            path: path(ROOT_PHISHING, '/telegram'),
            type: NAV_TYPE_ITEM,
            title: 'Telegram Bot',
            transKey: 'nav.phishing.telegram',
            Icon: ChatBubbleLeftRightIcon,
        },
    ]
}
