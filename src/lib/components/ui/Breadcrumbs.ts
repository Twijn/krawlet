import type { ButtonProps } from './Button';

export type BreadcrumbNavItem = {
	href: string;
	label?: string;
	tl?: string;
};

export type BreadcrumbProps = {
	navItems?: BreadcrumbNavItem[];
	buttons?: Partial<ButtonProps>[];
	defaultButtonProps?: ButtonProps;
};
