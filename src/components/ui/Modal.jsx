/**
 * Modal - Reusable modal component with backdrop
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Close handler (called when backdrop is clicked)
 * @param {ReactNode} props.children - Modal content
 * @param {string} props.className - Additional CSS classes for modal content
 */
export default function Modal({ isOpen, onClose, children, className = '' }) {
	if (!isOpen) return null;

	const handleBackdropClick = (e) => {
		// Only close if clicking the backdrop itself, not the content
		if (e.target === e.currentTarget && onClose) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 z-[200] flex items-center justify-center px-4"
			style={{
				background: 'rgba(118, 109, 91, 0.70)',
				backdropFilter: 'blur(10px)',
			}}
			onClick={handleBackdropClick}
		>
			{/* Modal content */}
			<div className={`bg-[#FFF1D5] rounded-[32px] p-8 max-w-[500px] w-full ${className}`}>
				{children}
			</div>
		</div>
	);
}
