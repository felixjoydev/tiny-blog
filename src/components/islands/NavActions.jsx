import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import writeIcon from '../../assets/icons/write.svg';

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
				.select('display_name, avatar_path')
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
				<a
					href="/auth?mode=login"
					className="bg-[#3f331c] text-white px-4 py-2.5 rounded-full text-[16px] font-['Exposure[-40]:Regular',sans-serif] tracking-[0.48px] hover:bg-[#2f2715] transition-colors"
				>
					Login
				</a>
				<a
					href="/auth?mode=signup"
					className="bg-[#da5700] text-white px-4 py-2.5 rounded-full text-[16px] font-['Exposure[-40]:Regular',sans-serif] tracking-[0.48px] hover:bg-[#c24e00] transition-colors"
				>
					Signup
				</a>
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
			<span className="text-white text-[18px] font-['Exposure[-40]:Regular',sans-serif]">
				{firstLetter}
			</span>
		);
	};

	return (
		<div className="flex items-center gap-2 relative">
			<a
				href="/write"
				className="bg-[#da5700] text-white px-4 py-2.5 h-10 rounded-full text-[16px] font-['Exposure[-40]:Regular',sans-serif] tracking-[0.48px] hover:bg-[#c24e00] transition-colors flex items-center gap-2.5"
			>
				<img src={writeIcon.src} alt="" className="w-4 h-4" />
				Write a post
			</a>

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
					className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100"
				>
					<a
						href="/settings"
						className="block px-4 py-2 text-[#3f331c] hover:bg-[#FFFAEF] transition-colors font-['Exposure[-40]:Regular',sans-serif]"
					>
						Settings
					</a>
					<button
						onClick={handleLogout}
						className="w-full text-left px-4 py-2 text-[#3f331c] hover:bg-[#FFFAEF] transition-colors font-['Exposure[-40]:Regular',sans-serif]"
					>
						Logout
					</button>
				</div>
			)}
		</div>
	);
}
