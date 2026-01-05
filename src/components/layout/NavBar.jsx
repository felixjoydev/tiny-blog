/**
 * NavBar - Reusable navigation layout component
 * Extracts common nav structure while preserving unique backgrounds per parent
 * 
 * @param {Object} props
 * @param {ReactNode} props.leftContent - Left side content (logo, close button, etc)
 * @param {ReactNode} props.rightContent - Right side content (actions, buttons, etc)
 * @param {ReactNode} props.backgroundLayers - Background elements (blur, gradient, solid)
 * @param {string} props.className - Additional CSS classes
 */
export default function NavBar({ leftContent, rightContent, backgroundLayers, className = '' }) {
	return (
		<nav className={`fixed inset-x-0 top-0 z-50 h-[var(--nav-height)] ${className}`}>
			{/* Background layers (blur, gradient, solid - passed from parent) */}
			{backgroundLayers}

			{/* Content wrapper */}
			<div className="relative flex items-center justify-between h-full px-[70px]">
				{/* Left content */}
				<div className="flex items-center gap-6">
					{leftContent}
				</div>

				{/* Right content */}
				<div className="flex items-center gap-4">
					{rightContent}
				</div>
			</div>
		</nav>
	);
}
