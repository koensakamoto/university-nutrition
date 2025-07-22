import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import ULogo from '../images/UtahLogo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to send reset email');
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                If you don't see the email in your inbox, check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
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
            <p className="text-gray-400 text-sm font-light text-center">Reset your password</p>
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
            <Mail className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="Enter your email address"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:transform-none disabled:hover:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail size={18} className="mr-2" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="text-red-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}