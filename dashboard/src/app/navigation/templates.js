import { 
  DocumentTextIcon,
  PaintBrushIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from 'constants/app.constant'

export const templates = {
    id: 'templates',
    type: NAV_TYPE_ROOT,
    path: '/templates',
    title: 'Templates',
    transKey: 'nav.templates.templates',
    Icon: DocumentTextIcon,
    childs: [
        {
            id: 'templates.browse',
            path: '/templates',
            type: NAV_TYPE_ITEM,
            title: 'Browse Templates',
            transKey: 'nav.templates.browse',
            Icon: DocumentTextIcon,
        },
        {
            id: 'templates.maker',
            path: '/template-maker',
            type: NAV_TYPE_ITEM,
            title: 'Template Maker',
            transKey: 'nav.templates.maker',
            Icon: PaintBrushIcon,
        },
        {
            id: 'templates.images',
            path: '/template-images',
            type: NAV_TYPE_ITEM,
            title: 'Upload Images',
            transKey: 'nav.templates.images',
            Icon: PhotoIcon,
        },
    ]
}
