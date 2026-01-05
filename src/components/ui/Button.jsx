/**
 * Button - Reusable button component
 * Structure: Supports icon via prop (pass icon to get button with icon)
 * Colors: Defined by variant prop (will be tokenized later)
 * 
 * @param {Object} props
 * @param {string} props.variant - Color theme: 'primary' | 'secondary' | 'tertiary' | 'danger'
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable button
 * @param {function} props.onClick - Click handler
 * @param {string} props.type - Button type: 'button' | 'submit'
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.icon - Optional icon element (makes it icon button)
 * @param {ReactNode} props.children - Button text/content
 */
export default function Button({
	variant = 'primary',
	loading = false,
	disabled = false,
	onClick,
	type = 'button',
	className = '',
	icon,
	children,
	...props
}) {
	// Base structure styles
	const baseStyles = 'h-10 px-4 py-2.5 rounded-full type-label transition-colors';
	
	// Icon layout (only applied when icon exists)
	const iconStyles = icon ? 'flex items-center gap-2.5' : '';

	// Color themes (TODO: move to design tokens)
	const colorThemes = {
		primary: 'bg-[#da5700] text-white hover:bg-[#c24e00]',
		secondary: 'bg-[#3f331c] text-white hover:bg-[#2f2715]',
		tertiary: 'bg-[#EEE0C5] text-[#3F331C] hover:bg-[#dcc9a8]',
		danger: 'bg-[#b42018] text-white hover:bg-[#a01c14]',
	};

	// Disabled state
	const disabledStyles = 'opacity-50 cursor-not-allowed';

	// Combine all styles
	const buttonClasses = [
		baseStyles,
		iconStyles,
		colorThemes[variant],
		(disabled || loading) && disabledStyles,
		className,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled || loading}
			className={buttonClasses}
			{...props}
		>
			{icon && <span className="w-4 h-4">{icon}</span>}
			{loading ? 'Loading...' : children}
		</button>
	);
}
