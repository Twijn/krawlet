import type { Snippet } from "svelte";

export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonClickHandler = (e: Event) => void | boolean | Promise<void> | Promise<boolean>;

export type ButtonProps = {
	type?: ButtonType;
	variant: ButtonVariant;
    href?: string;
	newTab?: boolean;
	size?: ButtonSize;
	onClick?: ButtonClickHandler;
	full?: boolean;
	disabled?: boolean;
	external?: boolean;
	tk?: string;
	title?: string;
	loading?: boolean;
	children?: Snippet;
}
