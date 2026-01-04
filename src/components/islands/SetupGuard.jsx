import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { isProfileComplete } from '../../lib/profileUtils';
import AccountSetup from './AccountSetup';

export default function SetupGuard() {
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState(null);
	const [userId, setUserId] = useState(null);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			// Get session
			const { data: { session }, error: sessionError } = await supabase.auth.getSession();

			if (sessionError || !session) {
				console.error('No session:', sessionError);
				window.location.href = '/auth';
				return;
			}

			setUserId(session.user.id);

			// Fetch profile
			const { data: profileData, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', session.user.id)
				.single();

			if (profileError) {
				console.error('Error fetching profile:', profileError);
				window.location.href = '/auth';
				return;
			}

			// Check if profile is complete
			if (isProfileComplete(profileData)) {
				// Redirect to handle-based URL if available
				if (profileData.handle) {
					window.location.href = `/u/${profileData.handle}`;
				} else {
					window.location.href = `/profile/${session.user.id}`;
				}
				return;
			}

			setProfile(profileData);
			setLoading(false);
		} catch (err) {
			console.error('Setup guard error:', err);
			window.location.href = '/auth';
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-[#da5700] border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return <AccountSetup profile={profile} userId={userId} />;
}
