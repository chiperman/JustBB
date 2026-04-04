import { 
    Home01Icon, 
    Tag01Icon, 
    Delete02Icon, 
    Image01Icon as GalleryIcon, 
    Location04Icon 
} from '@hugeicons/core-free-icons';

/**
 * Hugeicons 矢量图标数据结构
 * 由 (标签名, 属性对象) 组成的嵌套数组
 */
export type IconSvgObject = [string, { [key: string]: string | number }][];

export interface NavigationItem {
    id: string;
    icon: IconSvgObject;
    label: string;
    href: string;
    isAdminOnly?: boolean;
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
    { id: 'home', icon: Home01Icon as unknown as IconSvgObject, label: '首页', href: '/' },
    { id: 'gallery', icon: GalleryIcon as unknown as IconSvgObject, label: '画廊', href: '/gallery' },
    { id: 'tags', icon: Tag01Icon as unknown as IconSvgObject, label: '标签', href: '/tags' },
    { id: 'map', icon: Location04Icon as unknown as IconSvgObject, label: '地图', href: '/map' },
    { id: 'trash', icon: Delete02Icon as unknown as IconSvgObject, label: '回收站', href: '/trash', isAdminOnly: true },
];
