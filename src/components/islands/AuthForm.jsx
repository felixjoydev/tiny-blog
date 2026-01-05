import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import logo from '../../assets/icons/tiny-logo.svg';

export default function AuthForm() {
	const [mode, setMode] = useState('login'); // 'login' or 'signup'
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Check URL params to set initial mode
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const modeParam = params.get('mode');
		if (modeParam === 'signup') {
			setMode('signup');
		}
	}, []);

	const validateEmail = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	};

	const validateForm = () => {
		if (!email || !password) {
			setError('Please fill in all fields');
			return false;
		}

		if (!validateEmail(email)) {
			setError('Please enter a valid email address');
			return false;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters');
			return false;
		}

		if (mode === 'signup' && password !== confirmPassword) {
			setError('Passwords do not match');
			return false;
		}

		return true;
	};

	const handleLogin = async (e) => {
		e.preventDefault();
		setError('');

		if (!validateForm()) return;

		setLoading(true);

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				if (error.message.includes('Invalid login credentials')) {
					setError('Invalid email or password');
				} else {
					setError(error.message);
				}
				return;
			}

			if (data.session) {
				// Small delay to ensure session cookies are set
				setTimeout(() => {
					// Check for return URL from comment auth flow
					const returnUrl = sessionStorage.getItem('returnUrl');
					if (returnUrl) {
						sessionStorage.removeItem('returnUrl');
						window.location.href = returnUrl;
					} else {
						window.location.href = '/accounts/setup';
					}
				}, 100);
			}
		} catch (err) {
			console.error('Login error:', err);
			setError('An unexpected error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleSignup = async (e) => {
		e.preventDefault();
		setError('');

		if (!validateForm()) return;

		setLoading(true);

		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});

			if (error) {
				if (error.message.includes('already registered')) {
					setError('This email is already registered');
				} else {
					setError(error.message);
				}
				return;
			}

			if (data.session) {
				// Small delay to ensure session cookies are set
				setTimeout(() => {
					// Always go to setup for new signups
					// returnUrl will be checked after setup completes
					window.location.href = '/accounts/setup';
				}, 100);
			}
		} catch (err) {
			console.error('Signup error:', err);
			setError('An unexpected error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const toggleMode = () => {
		setMode(mode === 'login' ? 'signup' : 'login');
		setError('');
		setEmail('');
		setPassword('');
		setConfirmPassword('');
	};

	const isFormValid = () => {
		if (mode === 'login') {
			return email && password;
		}
		return email && password && confirmPassword;
	};

	return (
		<div className="flex flex-col gap-4 items-center w-full max-w-[360px]">
			<form
				onSubmit={mode === 'login' ? handleLogin : handleSignup}
				className="flex flex-col gap-4 items-center w-full"
			>
				{/* Header */}
				<div className="flex flex-col gap-[15px] items-center w-[176px]">
					<div className="h-[54.688px] w-[50px]">
						<img src={logo.src} alt="Tiny Logo" className="w-full h-full" />
					</div>
					<div className="flex flex-col gap-[3px] items-center w-full">
					<p className="type-body-lg text-[#3f331c] text-center w-full">
						{mode === 'login' ? 'Log in to Tiny' : 'Sign up to Tiny'}
					</p>
					<p className="type-body text-[#786237] text-center">
						Simple beautiful blogs
					</p>
				</div>
			</div>

				{/* Input Fields */}
				<div className="flex flex-col gap-3 w-full">
					{/* Email Input */}
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={loading}
						className={`bg-[#f4edde] h-10 px-2.5 py-2.5 rounded-lg w-full type-label-plain border-none outline-none ${
							email ? 'text-[#3f331c]' : 'text-[#3f331c] opacity-50 placeholder:text-[#3f331c] placeholder:opacity-50'
						}`}
					/>

					{/* Password Input */}
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={loading}
						className={`bg-[#f4edde] h-10 px-2.5 py-2.5 rounded-lg w-full type-label-plain border-none outline-none ${
							password ? 'text-[#3f331c]' : 'text-[#3f331c] opacity-50 placeholder:text-[#3f331c] placeholder:opacity-50'
						}`}
					/>

					{/* Confirm Password Input (Signup only) */}
					{mode === 'signup' && (
						<input
							type="password"
							placeholder="Re-enter password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							disabled={loading}
							className={`bg-[#f4edde] h-10 px-2.5 py-2.5 rounded-lg w-full type-label-plain border-none outline-none ${
								confirmPassword
									? 'text-[#3f331c]'
									: 'text-[#3f331c] opacity-50 placeholder:text-[#3f331c] placeholder:opacity-50'
							}`}
						/>
					)}
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
					disabled={loading || !isFormValid()}
					className={`bg-[#da5700] flex items-center justify-center px-4 py-2.5 rounded-full w-full transition-opacity ${
						loading || !isFormValid() ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-[#c24e00]'
					}`}
				>
					<span className="type-label text-white">
						{loading ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : mode === 'login' ? 'Login' : 'Sign up'}
					</span>
				</button>

				{/* Mode Toggle */}
				<p className="type-meta-plain text-[#786237] text-center w-full">
					{mode === 'login' ? (
						<>
							Don't have an account?{' '}
							<button
								type="button"
								onClick={toggleMode}
								className="type-meta-strong text-[#da5700] hover:underline"
							>
								Sign up
							</button>
						</>
					) : (
						<>
							Already have an account?{' '}
							<button
								type="button"
								onClick={toggleMode}
								className="type-meta-strong text-[#da5700] hover:underline"
							>
								Log in
							</button>
						</>
					)}
				</p>
			</form>
		</div>
	);
}
