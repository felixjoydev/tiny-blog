import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * ConfirmCloseModal - Confirmation modal for closing editor with unsaved changes
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Cancel handler (stay in editor)
 * @param {Function} props.onConfirm - Confirm handler (discard changes and close)
 */
export default function ConfirmCloseModal({ isOpen, onClose, onConfirm }) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="text-center">
				{/* Heading */}
				<h2 className="type-display-2 text-[#3F331C] mb-4">
					Are you sure you want to close?
				</h2>

				{/* Description */}
				<p className="type-body-lg-tight text-[#786237]">
					You have unsaved changes that will be lost if you close now
				</p>

				{/* Action buttons */}
				<div className="flex items-center justify-center gap-3 mt-6">
					<Button
						variant="secondary"
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={onConfirm}
					>
						Continue
					</Button>
				</div>
			</div>
		</Modal>
	);
}
