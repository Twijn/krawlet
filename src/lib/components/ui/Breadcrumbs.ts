import type { ButtonProps } from './Button';

export type BreadcrumbButton = Partial<ButtonProps> & {
	label?: string;
};

export type BreadcrumbNavItem = {
	href: string;
	label?: string;
	tl?: string;
};

export type BreadcrumbProps = {
	navItems?: BreadcrumbNavItem[];
	buttons?: BreadcrumbButton[];
	defaultButtonProps?: ButtonProps;
};
