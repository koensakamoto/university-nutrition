import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, User, Mail, Lock, X, Sparkles, BarChart3, History } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import ULogo from '../images/ULogo.png';

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

function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="terms-modal-title" className="text-xl font-bold text-gray-900">Terms of Service</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close Terms of Service modal"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Terms of Service</h3>
              <p className="text-sm text-gray-600 mt-1">Last updated: July 20, 2025</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">What this app does</h4>
                <p className="text-gray-700">Campus Nutrition helps you track your meals and nutrition from university dining halls. It's free to use for students and staff.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Your account</h4>
                <p className="text-gray-700">Keep your login details safe. You're responsible for what happens with your account. Let us know if something seems wrong.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">The nutrition data</h4>
                <p className="text-gray-700">We get nutrition info from dining halls, but it might not be 100% accurate. This isn't medical advice - talk to a doctor or nutritionist for health questions.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Be respectful</h4>
                <p className="text-gray-700">Don't spam, hack, or do anything that might harm the app or other users. Just use it normally to track your meals.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Changes and updates</h4>
                <p className="text-gray-700">We might update the app or these terms sometimes. We'll let you know about important changes.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Questions?</h4>
                <p className="text-gray-700">If you have issues or questions, contact us through the support form in your account settings.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="privacy-modal-title" className="text-xl font-bold text-gray-900">Privacy Policy</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close Privacy Policy modal"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Privacy Policy</h3>
              <p className="text-sm text-gray-600 mt-1">Last updated: July 20, 2025</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">What info we collect</h4>
                <p className="text-gray-700 mb-2">We collect your email, name, and profile details like:</p>
                <ul className="text-gray-700 space-y-1 ml-4">
                  <li>• Basic info: height, weight, age, activity level</li>
                  <li>• Goals: weight goals and nutrition preferences</li>
                  <li>• Dietary needs: allergies, food sensitivities, diet type</li>
                  <li>• Meal tracking: what you eat and when</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">How we use your info</h4>
                <p className="text-gray-700 mb-2">We use your data to:</p>
                <ul className="text-gray-700 space-y-1 ml-4">
                  <li>• Show personalized nutrition recommendations</li>
                  <li>• Track your meals and progress toward goals</li>
                  <li>• Filter foods based on your allergies and preferences</li>
                  <li>• Keep your account secure and send important updates</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Sharing your data</h4>
                <p className="text-gray-700">We don't sell or share your personal info with anyone. The only exception is if we're legally required to (like by a court order).</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Your choices</h4>
                <p className="text-gray-700">You can update your profile anytime or delete your account completely. When you delete your account, we remove all your personal data and meal history.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Data security</h4>
                <p className="text-gray-700">We use encryption and secure practices to protect your account. Your password is hashed and your personal health info stays private.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Questions?</h4>
                <p className="text-gray-700">Contact us through the support form if you have privacy concerns or want to delete your data.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();
  const { refetchProfile } = useAuth();

  React.useEffect(() => {
    setAnimate(true);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms and conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (validateForm()) {
      setLoading(true);
      try {
        const res = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            password: formData.password
          })
        });
        if (!res.ok) {
          const data = await res.json();
          setApiError(data.detail || 'Registration failed');
        } else {
          setApiError(''); // Clear any previous errors
          await refetchProfile();
          navigate('/dashboard');
        }
      } catch (err) {
        setApiError('Error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "/auth/google/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-4 md:py-6">
      {/* Modern Gradient Background - Same as Login */}
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

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section - Same as Login */}
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

        {/* Main Card - Same as Login */}
        <div className={`bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-white/60 transition-all duration-700 delay-200 hover:shadow-3xl ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Welcome Message */}
          <div className="flex flex-col items-center mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 text-center">Create Your Account</h2>
            <p className="text-gray-500 text-xs md:text-sm text-center">Get access to AI meal planning, meal history & charts</p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <div>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Name Fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                    placeholder="John"
                    required
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                  placeholder="Doe"
                  required
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email Field */}
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                  placeholder="you@example.com"
                  autoComplete="username"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms Agreement */}
            <div className="pt-1">
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="h-4 w-4 text-red-600 border-gray-300 rounded focus:outline-none transition-all duration-200 hover:border-gray-400"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeTerms" className="text-gray-700 leading-relaxed">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setTermsModalOpen(true)}
                      className="text-red-600 hover:text-red-700 hover:underline font-medium transition-colors duration-200"
                    >
                      Terms of Service
                    </button>
                    {" "}and{" "}
                    <button
                      type="button"
                      onClick={() => setPrivacyModalOpen(true)}
                      className="text-red-600 hover:text-red-700 hover:underline font-medium transition-colors duration-200"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>
              {errors.agreeTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeTerms}</p>}
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:transform-none disabled:hover:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  <ChevronRight size={18} className="mr-2" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3 md:my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">OR</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          {/* Sign In Link */}
          <div className="text-center mt-3 md:mt-4">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-red-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Modals */}
        <TermsOfServiceModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
        <PrivacyPolicyModal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
      </div>
    </div>
  );
}