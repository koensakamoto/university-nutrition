import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import Input from './Input';
import { ChevronRight, User, Mail, Lock, X } from 'lucide-react';
import { useAuth } from '../AuthProvider';

function Divider({ text, className = '' }) {
  if (text) {
    return (
      <div className={`relative my-6 ${className}`}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400">{text}</span>
        </div>
      </div>
    );
  }
  return <div className={`my-6 border-t border-gray-200 ${className}`}></div>;
}

function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Terms of Service</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <h3>Campus Nutrition Terms of Service</h3>
            <p><strong>Effective Date:</strong> July 5, 2025</p>
            <p>By using this app, you agree to our terms and privacy policy.</p>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose} variant="primary">
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Privacy Policy</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <h3>Campus Nutrition Privacy Policy</h3>
            <p><strong>Effective Date:</strong> July 5, 2025</p>
            <p>Your privacy is important to us. We collect only the information necessary to provide our nutrition tracking services. We do not share your personal data with third parties except as required by law. For more details, please contact support.</p>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose} variant="primary">
            I Understand
          </Button>
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
  const navigate = useNavigate();
  const { refetchProfile } = useAuth(); 

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
    console.log("handleSubmit", formData.firstName, formData.lastName, formData.email, formData.password)
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
          await refetchProfile();
          navigate('/dashboard');
        }
      } catch (err) {
        setApiError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "/auth/google/login";
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col justify-center mx-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 text-center">Create Your Account</h1>
          <p className="text-gray-400 text-base font-light text-center">Start tracking your campus nutrition today</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 mb-2">
            <Input label="First Name" name="firstName" placeholder="John" leftIcon={<User size={18} />} value={formData.firstName} onChange={handleChange} error={errors.firstName} />
            <Input label="Last Name" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
          </div>
          <Input label="Email Address" name="email" type="email" placeholder="you@example.com" leftIcon={<Mail size={18} />} value={formData.email} onChange={handleChange} error={errors.email} />
          <Input label="Password" name="password" type="password" placeholder="Create a strong password" leftIcon={<Lock size={18} />} value={formData.password} onChange={handleChange} error={errors.password} />
          <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm your password" leftIcon={<Lock size={18} />} value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
          <div className="my-4">
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input id="agreeTerms" name="agreeTerms" type="checkbox" checked={formData.agreeTerms} onChange={handleChange} className="h-4 w-4 text-[#C33332] border-gray-300 rounded focus:ring-[#C33332]" />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="agreeTerms" className="text-gray-700">
                  I agree to the{" "}
                  <button type="button" onClick={() => setTermsModalOpen(true)} className="text-[#C33332] hover:underline font-medium">Terms of Service</button>
                  {" "}and{" "}
                  <button type="button" onClick={() => setPrivacyModalOpen(true)} className="text-[#C33332] hover:underline font-medium">Privacy Policy</button>
                </label>
              </div>
            </div>
            {errors.agreeTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeTerms}</p>}
          </div>
          <TermsOfServiceModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
          <PrivacyPolicyModal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
          {apiError && <p className="text-red-500 text-sm mb-2 text-center">{apiError}</p>}
          <Button type="submit" fullWidth rightIcon={<ChevronRight size={18} />} loading={loading}>Create Account</Button>
        </form>
        <Divider text="OR" />
        <Button
          variant="outline"
          fullWidth
          onClick={handleGoogleSignup}
          leftIcon={
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.69 30.77 0 24 0 14.82 0 6.73 5.1 2.69 12.55l7.99 6.21C12.13 13.13 17.62 9.5 24 9.5z" />
                <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.18 5.59C43.98 37.13 46.1 31.36 46.1 24.55z" />
                <path fill="#FBBC05" d="M10.68 28.76c-.48-1.44-.76-2.97-.76-4.55s.28-3.11.76-4.55l-7.99-6.21C1.01 16.36 0 20.05 0 24s1.01 7.64 2.69 10.55l7.99-6.21z" />
                <path fill="#EA4335" d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.18-5.59c-2 1.34-4.56 2.13-7.71 2.13-6.38 0-11.87-3.63-14.32-8.76l-7.99 6.21C6.73 42.9 14.82 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </g>
            </svg>
          }
        >
          Sign up with Google
        </Button>
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C33332] hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 