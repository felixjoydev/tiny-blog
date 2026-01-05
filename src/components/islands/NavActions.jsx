import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import writeIcon from '../../assets/icons/write.svg';
import Button from '../ui/Button.jsx';

export default function NavActions() {
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState(null);
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef(null);
	const avatarRef = useRef(null);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session }, error }) => {
			if (error) {
				console.error('Error fetching session:', error);
				setSession(null);
			} else {
				setSession(session);
				if (session) {
					fetchProfile(session.user.id);
				}
			}
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			if (session) {
				fetchProfile(session.user.id);
			} else {
				setProfile(null);
			}
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		// Handle click outside to close dropdown
		function handleClickOutside(event) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target) &&
				avatarRef.current &&
				!avatarRef.current.contains(event.target)
			) {
				setShowDropdown(false);
			}
		}

		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdown]);

	const fetchProfile = async (userId) => {
		try {
			const { data, error } = await supabase
				.from('profiles')
				.select('display_name, handle, avatar_path')
				.eq('id', userId)
				.single();

			if (error) throw error;
			setProfile(data);
		} catch (error) {
			console.error('Error fetching profile:', error);
		}
	};

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
			setShowDropdown(false);
			window.location.href = '/';
		} catch (error) {
			console.error('Error signing out:', error);
		}
	};

	// Loading state - show skeleton
	if (loading) {
		return (
			<div className="flex items-center gap-2">
				<div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
				<div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
			</div>
		);
	}

	// Logged out state
	if (!session) {
		return (
			<div className="flex items-center gap-2">
				<Button variant="secondary" onClick={() => window.location.href = '/auth?mode=login'}>
					Login
				</Button>
				<Button variant="primary" onClick={() => window.location.href = '/auth?mode=signup'}>
					Signup
				</Button>
			</div>
		);
	}

	// Logged in state
	const getAvatarContent = () => {
		if (profile?.avatar_path) {
			// Construct the full URL for the avatar from Supabase Storage
			const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_path);
			return (
				<img
					src={data.publicUrl}
					alt={profile.display_name || 'User avatar'}
					className="w-full h-full object-cover"
				/>
			);
		}

		// Fallback: first letter of display name
		const firstLetter = profile?.display_name?.charAt(0).toUpperCase() || 'U';
		return (
			<span className="text-white type-body-lg">
				{firstLetter}
			</span>
		);
	};

	return (
		<div className="flex items-center gap-2 relative">
			<Button 
				variant="primary" 
				onClick={() => window.location.href = '/write'}
				icon={<img src={writeIcon.src} alt="" className="w-4 h-4" />}
				className="h-10"
			>
				Write a post
			</Button>

			<button
				ref={avatarRef}
				onClick={() => setShowDropdown(!showDropdown)}
				className="w-10 h-10 rounded-full bg-[#3f331c] flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#da5700] transition-all cursor-pointer"
				aria-label="User menu"
			>
				{getAvatarContent()}
			</button>

			{showDropdown && (
				<div
					ref={dropdownRef}
					className="absolute top-full right-0 mt-2 w-48 bg-[#F1E0BF] rounded-lg shadow-lg py-2 px-1 z-50"
				>
					{profile?.handle && (
						<a
							href={`/u/${profile.handle}`}
							className="block px-4 py-2 text-[#3f331c] hover:bg-[#FAECD2] transition-colors type-label rounded"
						>
							View Profile
						</a>
					)}
					<a
						href="/accounts"
						onClick={(e) => {
							e.preventDefault();
							// Save current scroll position and page
							sessionStorage.setItem('settings_scroll', window.scrollY.toString());
							sessionStorage.setItem('settings_referrer', window.location.pathname);
							window.location.href = '/accounts';
						}}
						className="block px-4 py-2 text-[#3f331c] hover:bg-[#FAECD2] transition-colors type-label rounded"
					>
						Settings
					</a>
					<button
						onClick={handleLogout}
						className="w-full text-left px-4 py-2 text-[#3f331c] hover:bg-[#FAECD2] transition-colors type-label rounded"
					>
						Logout
					</button>
				</div>
			)}
		</div>
	);
}
