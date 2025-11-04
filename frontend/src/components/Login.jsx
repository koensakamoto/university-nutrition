import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import ULogo from '../images/ULogo.png'
import { useAuth } from "../AuthProvider"

const GoogleIcon = () => (
  <svg className="mr-2" width="18" height="18" viewBox="0 0 48 48">
    <g>
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.69 30.77 0 24 0 14.82 0 6.73 5.1 2.69 12.55l7.99 6.21C12.13 13.13 17.62 9.5 24 9.5z" />
      <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.18 5.59C43.98 37.13 46.1 31.36 46.1 24.55z" />
      <path fill="#FBBC05" d="M10.68 28.76c-.48-1.44-.76-2.97-.76-4.55s.28-3.11.76-4.55l-7.99-6.21C1.01 16.36 0 20.05 0 24s1.01 7.64 2.69 10.55l7.99-6.21z" />
      <path fill="#EA4335" d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.18-5.59c-2 1.34-4.56 2.13-7.71 2.13-6.38 0-11.87-3.63-14.32-8.76l-7.99 6.21C6.73 42.9 14.82 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </g>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, error, loading, guestLogin, clearError } = useAuth()
  const navigate = useNavigate()
  const [animate, setAnimate] = useState(false);

  useEffect(() => { 
    setAnimate(true);
    // Clear any existing errors when component mounts
    if (clearError) {
      clearError();
    }
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  }

  const handleGuest = async () => {
    const success = await guestLogin();
    if (success) {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-4 md:py-6">
      {/* Modern Gradient Background - Enhanced */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-50/60 via-transparent to-cyan-50/40"></div>

      {/* Subtle Geometric Elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Background Image (optional) */}
      <img
        src="/bg-nutrition.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-5 blur-lg pointer-events-none select-none"
      />

      {/* Centered Layout */}
      <div className="w-full max-w-md relative z-10">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-4 md:mb-6">
            <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl mb-2 md:mb-3 border border-white/20 transition-all duration-700 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <img
                src={ULogo}
                alt="University Logo"
                className="w-8 h-8 md:w-10 md:h-10"
              />
            </div>
            <div className={`transition-all duration-700 delay-100 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 text-center">CrimsonBites</h1>
              <p className="text-gray-400 text-xs md:text-sm font-light text-center">Track your nutrition journey</p>
            </div>
          </div>

          {/* Login Card */}
          <div className={`bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-white/60 transition-all duration-700 delay-200 hover:shadow-3xl ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Welcome Message - Responsive */}
          <div className="flex flex-col items-center mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 text-center">Welcome back!</h2>
            <p className="text-gray-500 text-xs md:text-sm text-center">Sign in for AI meal planning, meal history & charts</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Email Field - Match Register Page Style */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                  placeholder="you@example.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Field - Match Register Page Style */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-blue-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password - Match Register Page Style */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center">
                {/* <input 
                  type="checkbox" 
                  className="h-4 w-4 text-red-600 border-gray-300 rounded "
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span> */}
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button - Match Register Page Style */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:transform-none disabled:hover:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider - Responsive */}
          <div className="relative my-3 md:my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In - Match Register Page */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/auth/google/login";
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Guest Option - Responsive */}
          <div className="relative my-3 md:my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">or</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleGuest}
            className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200 font-medium"
          >
            <User size={18} className="mr-2" />
            Continue as Guest
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Guest mode lets you explore without creating an account.<br />
            Your data will not be saved.
          </p>

          {/* Sign Up Link - Responsive */}
          <div className="text-center mt-3 md:mt-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login