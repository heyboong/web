import { 
  WrenchScrewdriverIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from 'constants/app.constant'

const ROOT_TOOLS = '/tools'

const path = (root, item) => `${root}${item}`;

export const tools = {
    id: 'tools',
    type: NAV_TYPE_ROOT,
    path: '/tools',
    title: 'Tools',
    transKey: 'nav.tools.tools',
    Icon: WrenchScrewdriverIcon,
    childs: [
        {
            id: 'tools.password-generator',
            path: path(ROOT_TOOLS, '/password-generator'),
            type: NAV_TYPE_ITEM,
            title: 'Password Generator',
            transKey: 'nav.tools.password-generator',
            Icon: KeyIcon,
        },
        {
            id: 'tools.2fa-generator',
            path: path(ROOT_TOOLS, '/2fa-generator'),
            type: NAV_TYPE_ITEM,
            title: '2FA Code Generator',
            transKey: 'nav.tools.2fa-generator',
            Icon: DevicePhoneMobileIcon,
        },
        {
            id: 'tools.change-pass',
            path: path(ROOT_TOOLS, '/change-pass'),
            type: NAV_TYPE_ITEM,
            title: 'Facebook Password Changer',
            transKey: 'nav.tools.change-pass',
            Icon: ShieldCheckIcon,
        },
        {
            id: 'tools.id-card-generator',
            path: path(ROOT_TOOLS, '/id-card-generator'),
            type: NAV_TYPE_ITEM,
            title: 'ID Card Generator',
            transKey: 'nav.tools.id-card-generator',
            Icon: UserIcon,
        },
        {
            id: 'tools.random-anh-the',
            path: path(ROOT_TOOLS, '/random-anh-the'),
            type: NAV_TYPE_ITEM,
            title: 'Random Ảnh Thẻ',
            transKey: 'nav.tools.random-anh-the',
            Icon: UserIcon,
        },
    ]
}
