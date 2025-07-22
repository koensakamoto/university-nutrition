import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import ULogo from '../images/UtahLogo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl mb-3 border border-white/20">
              <img src={ULogo} alt="University Logo" className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">CrimsonBites</h1>
            <p className="text-gray-400 text-sm font-light">Password Reset</p>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/60">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your password has been updated. You will be redirected to the login page in a few seconds.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
              >
                <ArrowLeft size={16} className="mr-2" />
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl mb-3 border border-white/20 transition-all duration-700 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <img src={ULogo} alt="University Logo" className="w-10 h-10" />
          </div>
          <div className={`transition-all duration-700 delay-100 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1 text-center">CrimsonBites</h1>
            <p className="text-gray-400 text-sm font-light text-center">Create new password</p>
          </div>
        </div>

        {/* Main Card */}
        <div className={`bg-white rounded-2xl shadow-2xl p-8 border border-white/60 transition-all duration-700 delay-200 hover:shadow-3xl ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Back to Login Link */}
          <Link
            to="/login"
            className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Login
          </Link>

          {/* Form Header */}
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-sm text-gray-600">
              <p>Password must be at least 8 characters long.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:transform-none disabled:hover:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock size={18} className="mr-2" />
                  Reset Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}