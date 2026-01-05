import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * DeletePostModal - Confirmation modal for deleting a post
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Close/cancel handler
 * @param {Function} props.onConfirm - Delete confirmation handler
 * @param {string} props.postTitle - Title of the post to be deleted
 * @param {boolean} props.isDeleting - Whether deletion is in progress
 */
export default function DeletePostModal({ isOpen, onClose, onConfirm, postTitle, isDeleting = false }) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="text-center">
				{/* Heading */}
				<h2 className="type-display-2 text-[#3F331C] mb-4">
					Are you sure you want to delete this post?
				</h2>

				{/* Description with post title highlighted */}
				<p className="type-body-lg-tight text-[#786237]">
					Your post{' '}
					<span className="text-[#da5700]">{postTitle}</span>
					{' '}will be deleted and you won't be able to retrieve it
				</p>

				{/* Action buttons */}
				<div className="flex items-center justify-center gap-3 mt-6">
					<Button
						variant="secondary"
						onClick={onClose}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={onConfirm}
						loading={isDeleting}
						disabled={isDeleting}
						icon={
							<svg 
								className="w-4 h-4" 
								viewBox="0 0 16 16" 
								fill="none"
							>
								<path 
									d="M2.66669 4H13.3334M6.00002 7.33333V11.3333M10 7.33333V11.3333M3.33335 4L4.00002 13.3333C4.00002 13.6869 4.14049 14.026 4.39054 14.2761C4.64059 14.5261 4.97973 14.6667 5.33335 14.6667H10.6667C11.0203 14.6667 11.3594 14.5261 11.6095 14.2761C11.8595 14.026 12 13.6869 12 13.3333L12.6667 4M5.33335 4V2.66667C5.33335 2.48986 5.40359 2.32029 5.52862 2.19526C5.65364 2.07024 5.82321 2 6.00002 2H10C10.1769 2 10.3464 2.07024 10.4714 2.19526C10.5965 2.32029 10.6667 2.48986 10.6667 2.66667V4" 
									stroke="white" 
									strokeWidth="1.5" 
									strokeLinecap="round" 
									strokeLinejoin="round"
								/>
							</svg>
						}
					>
						Delete
					</Button>
				</div>
			</div>
		</Modal>
	);
}
