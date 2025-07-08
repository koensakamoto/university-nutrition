import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MailIcon, LockIcon, LogInIcon, ChromeIcon, UserIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import ULogo from '../images/ULogo.png'
import { useAuth } from "../AuthProvider"

const GoogleIcon = () => (
  <svg className="mr-2" width="18" height="18" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.69 30.77 0 24 0 14.82 0 6.73 5.1 2.69 12.55l7.99 6.21C12.13 13.13 17.62 9.5 24 9.5z" /><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.18 5.59C43.98 37.13 46.1 31.36 46.1 24.55z" /><path fill="#FBBC05" d="M10.68 28.76c-.48-1.44-.76-2.97-.76-4.55s.28-3.11.76-4.55l-7.99-6.21C1.01 16.36 0 20.05 0 24s1.01 7.64 2.69 10.55l7.99-6.21z" /><path fill="#EA4335" d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.18-5.59c-2 1.34-4.56 2.13-7.71 2.13-6.38 0-11.87-3.63-14.32-8.76l-7.99 6.21C6.73 42.9 14.82 48 24 48z" /><path fill="none" d="M0 0h48v48H0z" /></g></svg>
);

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, error, loading, guestLogin } = useAuth()
  const navigate = useNavigate()
  const [animate, setAnimate] = useState(false);

  useEffect(() => { setAnimate(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
    // No setLoading or setError here; handled by context
  }

  const handleGuest = async () => {
    const success = await guestLogin();
    if (success) {
      navigate('/dashboard');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full relative bg-gradient-to-br from-gray-50 to-white px-4 overflow-hidden">
      <img src="/bg-nutrition.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-10 blur-lg pointer-events-none select-none" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 bg-white/60" style={{ zIndex: 1 }} aria-hidden="true"></div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative z-10">
        <div className={`flex flex-col items-center mb-6 pt-2 pb-2 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <img
            src={ULogo}
            alt="University Logo"
            className="w-20 h-20 mb-2"
          />
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Campus Nutrition</h1>
          <p className="text-gray-400 mt-1 text-base font-light">Sign in to track your nutrition</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MailIcon size={18} className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                placeholder="you@example.com"
                aria-label="Email address"
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon size={18} className="text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                placeholder="••••••••"
                aria-label="Password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                tabIndex={0}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                aria-label="Remember me"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            disabled={loading}
            aria-label="Sign in"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              <LogInIcon size={18} className="mr-2" />
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="mt-2 text-center">
            <Link to="/register" className="text-blue-600 hover:underline text-sm font-medium" tabIndex={0} aria-label="Create an account">Create an account</Link>
          </div>
        </form>
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <div className={`mt-3 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              type="button"
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-base font-semibold text-gray-700 hover:shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              style={{ fontWeight: 600 }}
              aria-label="Continue with Google"
              onClick={() => {
                window.location.href = "http://localhost:8000/auth/google/login";
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400">Or</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGuest}
            className={`w-full flex items-center justify-center py-2 px-4 border border-gray-400 border-2 rounded-lg shadow-sm bg-white text-base font-semibold text-gray-700 hover:bg-gray-100 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c41e3a] transition ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ fontWeight: 600, borderStyle: 'solid' }}
            aria-label="Continue as Guest"
          >
            <UserIcon size={18} className="mr-2" />
            Continue as Guest
          </button>
          <div className="mt-1 text-center text-xs text-gray-500">
            Guest mode lets you explore the app without creating an account. Your data will not be saved.
          </div>
        </div>
      </div>
    </div>
  )
}
export default Login
