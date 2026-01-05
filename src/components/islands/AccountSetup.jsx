import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { normalizeHandle, getHandleError, RESERVED_HANDLES } from '../../lib/urls';
import logo from '../../assets/icons/tiny-logo.svg';
import scanUserIcon from '../../assets/icons/scan-user.svg';
import avatarCloseIcon from '../../assets/icons/avatar-close.svg';

export default function AccountSetup({ profile, userId }) {
	const [displayName, setDisplayName] = useState(profile?.display_name === 'New user' ? '' : profile?.display_name || '');
	const [handle, setHandle] = useState('');
	const [handleError, setHandleError] = useState('');
	const [checkingHandle, setCheckingHandle] = useState(false);
	const [bio, setBio] = useState(profile?.bio || '');
	const [avatarFile, setAvatarFile] = useState(null);
	const [avatarPreview, setAvatarPreview] = useState(null);
	const [existingAvatarPath, setExistingAvatarPath] = useState(profile?.avatar_path || null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const fileInputRef = useRef(null);
	const checkHandleTimeoutRef = useRef(null);

	// Load existing avatar preview if available
	useEffect(() => {
		if (existingAvatarPath && !avatarPreview) {
			const { data } = supabase.storage.from('avatars').getPublicUrl(existingAvatarPath);
			setAvatarPreview(data.publicUrl);
		}
	}, [existingAvatarPath]);

	// Live handle availability check (debounced)
	useEffect(() => {
		// Clear existing timeout
		if (checkHandleTimeoutRef.current) {
			clearTimeout(checkHandleTimeoutRef.current);
		}

		// Reset error when handle changes
		setHandleError('');

		if (!handle || handle.trim() === '') {
			return;
		}

		const normalized = normalizeHandle(handle);

		// Check format first
		const formatError = getHandleError(normalized);
		if (formatError) {
			setHandleError(formatError);
			return;
		}

		// Debounce the availability check
		checkHandleTimeoutRef.current = setTimeout(async () => {
			setCheckingHandle(true);

			try {
				const { data, error } = await supabase
					.from('profiles')
					.select('handle')
					.eq('handle', normalized)
					.maybeSingle();

				if (error) {
					console.error('Handle check error:', error);
					setCheckingHandle(false);
					return;
				}

				if (data) {
					setHandleError('This handle is already taken');
				}
			} catch (err) {
				console.error('Unexpected error checking handle:', err);
			} finally {
				setCheckingHandle(false);
			}
		}, 500); // 500ms debounce

		return () => {
			if (checkHandleTimeoutRef.current) {
				clearTimeout(checkHandleTimeoutRef.current);
			}
		};
	}, [handle]);

	const handleFileSelect = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			setError('Please select an image file');
			return;
		}

		// Validate file size (2MB max)
		if (file.size > 2 * 1024 * 1024) {
			setError('Image size must be less than 2MB');
			return;
		}

		setError('');
		setAvatarFile(file);

		// Generate preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setAvatarPreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const handleRemoveAvatar = () => {
		setAvatarFile(null);
		setAvatarPreview(null);
		setExistingAvatarPath(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const validateForm = () => {
		if (!displayName || displayName.trim() === '') {
			setError('Name is required');
			return false;
		}

		if (displayName.trim().length < 2) {
			setError('Name must be at least 2 characters');
			return false;
		}

		if (displayName === 'New user') {
			setError('Please choose a different name');
			return false;
		}

		if (!handle || handle.trim() === '') {
			setError('Handle is required');
			return false;
		}

		const normalized = normalizeHandle(handle);
		const handleValidationError = getHandleError(normalized);
		if (handleValidationError) {
			setError(handleValidationError);
			return false;
		}

		if (handleError) {
			setError(handleError);
			return false;
		}

		if (!bio || bio.trim() === '') {
			setError('Bio is required');
			return false;
		}

		if (bio.trim().length < 10) {
			setError('Bio must be at least 10 characters');
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (!validateForm()) return;

		setUploading(true);

		try {
			let avatarPath = existingAvatarPath;

			// Upload avatar if a new file was selected
			if (avatarFile) {
				const fileExt = avatarFile.name.substring(avatarFile.name.lastIndexOf('.'));
				const uploadPath = `${userId}/avatar${fileExt}`;

				const { error: uploadError } = await supabase.storage
					.from('avatars')
					.upload(uploadPath, avatarFile, {
						cacheControl: '3600',
						upsert: true,
					});

				if (uploadError) {
					console.error('Upload error:', uploadError);
					setError('Failed to upload avatar. Please try again.');
					setUploading(false);
					return;
				}

				avatarPath = uploadPath;
			}

			// Update profile with name, bio, handle, avatar_path, and onboarded flag
			const normalizedHandle = normalizeHandle(handle);
			const { error: updateError } = await supabase
				.from('profiles')
				.update({
					display_name: displayName.trim(),
					bio: bio.trim(),
					handle: normalizedHandle,
					avatar_path: avatarPath,
					onboarded: true,
				})
				.eq('id', userId);

			if (updateError) {
				console.error('Update error:', updateError);
				setError('Failed to update profile. Please try again.');
				setUploading(false);
				return;
			}

			// Check for return URL from comment auth flow
			const returnUrl = sessionStorage.getItem('returnUrl');
			if (returnUrl) {
				sessionStorage.removeItem('returnUrl');
				window.location.href = returnUrl;
			} else {
				// Redirect to handle-based profile URL
				window.location.href = `/u/${normalizedHandle}`;
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			setError('An unexpected error occurred. Please try again.');
			setUploading(false);
		}
	};

	const isFormValid = () => {
		return (
			displayName &&
			displayName.trim() !== '' &&
			handle &&
			handle.trim() !== '' &&
			!handleError &&
			!checkingHandle &&
			bio &&
			bio.trim() !== ''
		);
	};

	const getAvatarDisplay = () => {
		if (avatarPreview) {
			return (
				<div className="relative">
					<img
						src={avatarPreview}
						alt="Avatar preview"
						className="w-16 h-16 rounded-[20px] object-cover"
					/>
					<button
						type="button"
						onClick={handleRemoveAvatar}
						className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ECDEC2] flex items-center justify-center hover:bg-[#dcc9a8] transition-colors"
						aria-label="Remove avatar"
					>
						<img src={avatarCloseIcon.src} alt="" className="w-6 h-6" />
					</button>
				</div>
			);
		}

		// Show placeholder with first letter if name is entered
		if (displayName && displayName.trim() !== '') {
			const firstLetter = displayName.trim().charAt(0).toUpperCase();
			return (
				<div className="w-16 h-16 rounded-[20px] bg-[#3f331c] flex items-center justify-center">
						<span className="text-white type-h3">
						{firstLetter}
					</span>
				</div>
			);
		}

		// Default placeholder
		return (
			<div className="bg-[#f4edde] w-16 h-16 rounded-[20px] flex items-center justify-center p-2.5">
				<img src={scanUserIcon.src} alt="" className="w-6 h-6" />
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-4 items-center w-full max-w-[360px]">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center w-full">
				{/* Header */}
				<div className="flex flex-col gap-[15px] items-center w-[176px]">
					<div className="h-[54.688px] w-[50px]">
						<img src={logo.src} alt="Tiny Logo" className="w-full h-full" />
					</div>
					<div className="flex flex-col gap-[3px] items-center w-full">
						<p className="type-body-lg text-[#3f331c] text-center w-full">
							Welcome to Tiny
						</p>
						<p className="type-body text-[#786237] text-center">
							Simple beautiful blogs
						</p>
					</div>
				</div>

				{/* Avatar Section */}
				<div className="flex flex-col gap-3 items-center w-[132px]">
					{getAvatarDisplay()}

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileSelect}
						className="hidden"
						id="avatar-upload"
					/>
					<label
						htmlFor="avatar-upload"
						className="bg-[#3f331c] flex items-center justify-center px-2 py-2 rounded-full w-full cursor-pointer hover:bg-[#2f2715] transition-colors"
					>
						<span className="type-meta-strong text-white">
							Upload your avatar
						</span>
					</label>
				</div>

				{/* Input Fields */}
				<div className="flex flex-col gap-3 w-full">
					{/* Name Input */}
					<input
						type="text"
						placeholder="Name"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						disabled={uploading}
						className={`bg-[#f4edde] h-10 px-2.5 py-2.5 rounded-lg w-full type-label-plain border-none outline-none ${
							displayName ? 'text-[#3f331c]' : 'text-[#3f331c] opacity-50 placeholder:text-[#3f331c] placeholder:opacity-50'
						}`}
					/>

					{/* Handle Input */}
					<div className="flex flex-col gap-1 w-full">
						<p className="type-meta-plain text-[#786237] px-1">
							Your handle cannot be changed later. Choose carefully!
						</p>
						<div className="relative w-full">
							<span className="absolute left-2.5 top-1/2 -translate-y-1/2 type-label-plain text-[#3f331c] pointer-events-none">
								@
							</span>
							<input
								type="text"
								placeholder="your_handle"
								value={handle}
								onChange={(e) => setHandle(e.target.value)}
								disabled={uploading}
								className={`bg-[#f4edde] h-10 pl-6 pr-2.5 py-2.5 rounded-lg w-full type-label-plain border-none outline-none ${
									handle ? 'text-[#3f331c]' : 'text-[#3f331c] opacity-50 placeholder:text-[#3f331c] placeholder:opacity-50'
								}`}
							/>
							{checkingHandle && (
								<span className="absolute right-2.5 top-1/2 -translate-y-1/2 type-meta-plain text-[#786237]">
									Checking...
								</span>
							)}
						</div>
						{handleError && (
							<p className="text-[#B42018] type-meta-plain px-1">
								{handleError}
							</p>
						)}
						{handle && !handleError && !checkingHandle && (
							<p className="text-[#4A7C59] type-meta-plain px-1">
								✓ Available
							</p>
						)}
					</div>

					{/* Bio Textarea */}
					<textarea
						placeholder="Short bio"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						disabled={uploading}
						rows={5}
						className={`bg-[#f4edde] h-[124px] px-2.5 py-2.5 rounded-lg w-full type-label-plain border-none outline-none resize-none ${
							bio ? 'text-[#3f331c]' : 'text-[#3f331c] opacity-50 placeholder:text-[#3f331c] placeholder:opacity-50'
						}`}
					/>
				</div>

				{/* Error Message */}
				{error && (
					<p className="text-[#B42018] text-center type-meta-plain w-full">
						{error}
					</p>
				)}

				{/* Submit Button */}
				<button
					type="submit"
					disabled={uploading || !isFormValid()}
					className={`bg-[#da5700] flex items-center justify-center px-4 py-2.5 rounded-full w-full transition-opacity ${
						uploading || !isFormValid() ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-[#c24e00]'
					}`}
				>
					<span className="type-label text-white">
						{uploading ? 'Setting up...' : 'Get started'}
					</span>
				</button>
			</form>
		</div>
	);
}
