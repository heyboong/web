import { 
                CogIcon, 
                UserGroupIcon, 
        ChartBarIcon,
    ChartPieIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    PaintBrushIcon,
    ClockIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from 'constants/app.constant'

const ROOT_ADMIN = '/admin'

const path = (root, item) => `${root}${item}`;

export const admin = {
    id: 'admin',
    type: NAV_TYPE_ROOT,
    path: '/admin',
    title: 'Admin',
    transKey: 'nav.admin.admin',
    Icon: CogIcon,
    childs: [
        {
            id: 'admin.settings',
            path: path(ROOT_ADMIN, '/settings'),
            type: NAV_TYPE_ITEM,
            title: 'Site Settings',
            transKey: 'nav.admin.settings',
            Icon: CogIcon,
        },
        {
            id: 'admin.users',
            path: path(ROOT_ADMIN, '/users'),
            type: NAV_TYPE_ITEM,
            title: 'User Management',
            transKey: 'nav.admin.users',
            Icon: UserGroupIcon,
        },
        {
            id: 'admin.analytics',
            path: path(ROOT_ADMIN, '/analytics'),
            type: NAV_TYPE_ITEM,
            title: 'Analytics Dashboard',
            transKey: 'nav.admin.analytics',
            Icon: ChartPieIcon,
        },
        {
            id: 'admin.activity',
            path: path(ROOT_ADMIN, '/activity'),
            type: NAV_TYPE_ITEM,
            title: 'Activity Log',
            transKey: 'nav.admin.activity',
            Icon: ClipboardDocumentListIcon,
        },
        {
            id: 'admin.userAnalytics',
            path: path(ROOT_ADMIN, '/user-analytics'),
            type: NAV_TYPE_ITEM,
            title: 'User Analytics',
            transKey: 'nav.admin.userAnalytics',
            Icon: ChartBarIcon,
        },
        {
            id: 'admin.phishing.templates',
            path: path(ROOT_ADMIN, '/phishing/templates'),
            type: NAV_TYPE_ITEM,
            title: 'Template Management',
            transKey: 'nav.admin.phishing.templates',
            Icon: DocumentTextIcon,
        },
        {
            id: 'admin.template.maker',
            path: path(ROOT_ADMIN, '/template-maker'),
            type: NAV_TYPE_ITEM,
            title: 'Template Maker',
            transKey: 'nav.admin.template.maker',
            Icon: PaintBrushIcon,
        },
        {
            id: 'admin.template.approval',
            path: path(ROOT_ADMIN, '/template-approval'),
            type: NAV_TYPE_ITEM,
            title: 'Template Approval',
            transKey: 'nav.admin.template.approval',
            Icon: ClockIcon,
        },
        {
            id: 'admin.phishing.domains',
            path: path(ROOT_ADMIN, '/phishing/domains'),
            type: NAV_TYPE_ITEM,
            title: 'Domain Management',
            transKey: 'nav.admin.phishing.domains',
            Icon: GlobeAltIcon,
        },
    ]
}
