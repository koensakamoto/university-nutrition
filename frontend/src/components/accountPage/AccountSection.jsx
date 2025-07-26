import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Info, Mail, User, Camera, Key, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AccountInfoToolTip } from './AccountInfoToolTip';
import { useAuth, useFetchWithAuth } from '../../AuthProvider';

export const AccountSection = () => {
  const { user, logout, refetchProfile } = useAuth();
  const fetchWithAuth = useFetchWithAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [image, setImage] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');  
  const [tempImage, setTempImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef(null);
  const timeoutRefs = useRef([]);

  // Helper function to create cleanup-able timeouts
  const createTimeout = (callback, delay) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  };

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await fetchWithAuth('/api/profile');
        if (error || !data) throw new Error('Failed to fetch profile');
        setName(data.profile.name || '');
        setImage(data.profile.image || '');
        setTempName(data.profile.name || '');
        setPreviewImage('');
        setTempImage(null);
      } catch (err) {
        console.error('Could not load account info:', err);
        // Set a general error state that can be displayed to user
        setNameError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setTempEmail(user.email);
      setEmail(user.email);
    }
  }, [user]);




  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image must be smaller than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageError('Please select a valid image file');
        return;
      }
      
      setImageError('');
      setTempImage(file);
      const reader = new FileReader();
      
      const cleanup = () => {
        reader.onloadend = null;
        reader.onerror = null;
      };
      
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        cleanup();
      };
      reader.onerror = () => {
        setImageError('Failed to read image file');
        setPreviewImage('');
        cleanup();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = async () => {
    if (!tempImage) return;
    setImageLoading(true);
    setImageError('');
    setImageSuccess('');
    
    let uploadedImageUrl = null;
    
    try {
      // Step 1: Upload image file
      const formData = new FormData();
      formData.append('image', tempImage);
      const { data, error } = await fetchWithAuth('/api/profile/image', {
        method: 'POST',
        body: formData,
      });
      if (error || !data) throw new Error('Failed to upload image');
      
      uploadedImageUrl = data.url;
      
      // Step 2: Update profile with new image URL
      const { data: updateData, error: updateError } = await fetchWithAuth('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadedImageUrl })
      });
      
      if (updateError || !updateData) {
        // If profile update fails, attempt to clean up uploaded image
        try {
          await fetchWithAuth('/api/profile/image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: uploadedImageUrl })
          });
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded image:', cleanupError);
        }
        throw new Error('Failed to update profile with new image');
      }
      
      // Success - update UI state
      setImage(uploadedImageUrl);
      setTempImage(null);
      setPreviewImage('');
      setImageSuccess('Profile image updated!');
      createTimeout(() => setImageSuccess(''), 3000);
      
    } catch (err) {
      console.error('Image upload failed:', err);
      if (err.message?.includes('size')) {
        setImageError('Image file is too large. Please select a smaller image.');
      } else if (err.message?.includes('format') || err.message?.includes('type')) {
        setImageError('Invalid image format. Please select a JPG, PNG, or GIF image.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setImageError('Network error. Please check your connection and try again.');
      } else {
        setImageError('Failed to upload image. Please try again.');
      }
    } finally {
      setImageLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    // Validation
    if (!tempName.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    if (tempName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    if (tempName.trim().length > 50) {
      setNameError('Name must be less than 50 characters');
      return;
    }
    
    setNameLoading(true);
    setNameError('');
    setNameSuccess('');
    
    try {
      const { data, error } = await fetchWithAuth('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName.trim() })
      });
      if (error || !data) throw new Error('Failed to update name');
      setName(tempName.trim());
      setEditingName(false);
      setNameSuccess('Name updated!');
      createTimeout(() => setNameSuccess(''), 3000);
    } catch (err) {
      console.error('Name update failed:', err);
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setNameError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('validation')) {
        setNameError('Invalid name format. Please use only letters and spaces.');
      } else {
        setNameError('Failed to update name. Please try again.');
      }
    } finally {
      setNameLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!tempEmail.trim()) {
      setEmailError('Email cannot be empty');
      return;
    }
    if (!emailRegex.test(tempEmail.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');
    
    try {
      const { data, error } = await fetchWithAuth('/api/profile/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail.trim() })
      });
      if (error || !data) throw new Error('Failed to update email');
      
      setEmail(tempEmail.trim());
      setEditingEmail(false);
      setEmailSuccess('Email updated! Redirecting to login...');
      
      // Small delay to show success message before redirect
      createTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 1500);
      
    } catch (err) {
      console.error('Email update failed:', err);
      if (err.message?.includes('duplicate') || err.message?.includes('exists')) {
        setEmailError('This email address is already in use.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setEmailError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('validation') || err.message?.includes('invalid')) {
        setEmailError('Invalid email format. Please enter a valid email address.');
      } else {
        setEmailError('Failed to update email. Please try again.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Enhanced password validation
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (tempPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (!/(?=.*[a-z])/.test(tempPassword)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/(?=.*[A-Z])/.test(tempPassword)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/(?=.*\d)/.test(tempPassword)) {
      setPasswordError('Password must contain at least one number');
      return;
    }
    if (tempPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      const { data, error } = await fetchWithAuth('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: tempPassword
        })
      });
      if (error || !data) {
        setPasswordError((data && data.detail) || 'Failed to update password');
        return;
      }
      setEditingPassword(false);
      setPasswordSuccess('Password updated successfully!');
      setTempPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      createTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      console.error('Password update failed:', err);
      if (err.message?.includes('current password') || err.message?.includes('incorrect')) {
        setPasswordError('Current password is incorrect.');
      } else if (err.message?.includes('weak') || err.message?.includes('strength')) {
        setPasswordError('Password is too weak. Please choose a stronger password.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setPasswordError('Network error. Please check your connection and try again.');
      } else {
        setPasswordError('Failed to update password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };


  // Helper to get the correct image URL with XSS protection
  const getImageUrl = (url) => {
    if (!url) return null;
    
    // Block potentially dangerous URL schemes
    const dangerousSchemes = ['javascript:', 'data:text/', 'data:application/', 'vbscript:', 'data:text/html'];
    const urlLower = url.toLowerCase();
    
    for (const scheme of dangerousSchemes) {
      if (urlLower.startsWith(scheme)) {
        console.warn('Blocked potentially dangerous image URL:', url);
        return null;
      }
    }
    
    // Allow safe data URLs for images
    if (urlLower.startsWith('data:image/')) {
      return url;
    }
    
    // Allow relative paths from our static directory
    if (url.startsWith('/static/')) {
      return url;
    }
    
    // Allow HTTPS URLs from trusted domains (adjust as needed)
    if (url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // Add your trusted domains here
        const trustedDomains = ['imgur.com', 'gravatar.com', 'amazonaws.com'];
        const isTrusted = trustedDomains.some(domain => 
          urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
        );
        if (isTrusted) {
          return url;
        }
      } catch (e) {
        console.warn('Invalid URL format:', url);
        return null;
      }
    }
    
    // For local development, allow localhost
    if (url.startsWith('http://localhost')) {
      return url;
    }
    
    console.warn('Blocked untrusted image URL:', url);
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-6">
        <div className="text-gray-600">Loading account info...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8" style={{width: '100%', maxWidth: 'none'}}>
      <div className="flex items-center justify-between mb-6 w-full max-w-2xl">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Account Information</h2>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            onClick={() => setShowTooltip(true)}
            aria-label="Show account info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
      <AccountInfoToolTip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="info"
      />
      
      <div className="space-y-6">  
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-gray-200">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="flex items-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 ring-4 ring-gray-100">
                {previewImage ? (
                  <img
                    src={getImageUrl(previewImage)}
                    alt="Preview"
                    className="w-full h-full object-cover object-center"
                  />
                ) : image ? (
                  <img
                    src={getImageUrl(image)}
                    alt="Profile"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white uppercase">
                    {name ? name[0] : '?'}
                  </span>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  onClick={handleImageUploadClick}
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              
              <div className="ml-5">
                <span className="text-2xl font-bold text-gray-900">{name}</span>
               
              </div>
            </div>
          </div>
        </div>

        {previewImage && (
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={handleImageUpload}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-200"
              disabled={imageLoading}
            >
              {imageLoading ? 'Uploading...' : 'Save Image'}
            </button>
            <button
              onClick={() => { setPreviewImage(''); setTempImage(null); setImageError(''); setImageSuccess(''); }}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              disabled={imageLoading}
            >
              Cancel
            </button>
          </div>
        )}
        {imageError && <div className="text-red-600 mb-2">{imageError}</div>}
        {imageSuccess && <div className="text-green-600 mb-2">{imageSuccess}</div>}

        <div className="bg-gray-50 rounded-lg p-6">
          <label className="block text-gray-800 font-semibold mb-3">Name</label>
          {editingName ? (
            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)}
                  aria-label="Edit name"
                  aria-describedby={nameError ? "name-error" : undefined}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleNameUpdate} 
                    disabled={nameLoading}
                    className={`px-6 py-3 rounded-lg font-medium ${nameLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                  >
                    {nameLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => {
                      setTempName(name);
                      setEditingName(false);
                      setNameError('');
                    }} 
                    className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {nameError && (
                <div id="name-error" className="mt-2 text-red-600 text-sm" role="alert">{nameError}</div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User size={20} className="text-gray-500 mr-3" />
                <span className="text-gray-900 text-lg">{name}</span>
              </div>
              <button
                onClick={() => {
                  setEditingName(true);
                  setNameSuccess('');
                  setNameError('');
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                aria-label="Edit Name"
              >
                <Pencil size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          )}
          {nameSuccess && (
            <div className="mt-2 text-green-600 text-sm">{nameSuccess}</div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <label className="block text-gray-800 font-semibold mb-3">Email</label>
          {editingEmail ? (
            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  value={tempEmail} 
                  onChange={(e) => setTempEmail(e.target.value)}
                  aria-label="Edit email address"
                  aria-describedby={emailError ? "email-error" : undefined}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleEmailUpdate} 
                    disabled={emailLoading}
                    className={`px-6 py-3 rounded-lg font-medium ${emailLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                  >
                    {emailLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => {
                      setTempEmail(email);
                      setEditingEmail(false);
                      setEmailError('');
                    }} 
                    className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {emailError && (
                <div id="email-error" className="mt-2 text-red-600 text-sm" role="alert">{emailError}</div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail size={20} className="text-gray-500 mr-3" />
                <span className="text-gray-900 text-lg">{email}</span>
              </div>
              <button
                onClick={() => {
                  setEditingEmail(true);
                  setEmailSuccess('');
                  setEmailError('');
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                aria-label="Edit Email"
              >
                <Pencil size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          )}
          {emailSuccess && (
            <div className="mt-2 text-green-600 text-sm">{emailSuccess}</div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <label className="block text-gray-800 font-semibold mb-3">Password</label>
          {editingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    aria-label="Current password"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">New Password</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={tempPassword} 
                    onChange={(e) => setTempPassword(e.target.value)}
                    aria-label="New password"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-label="Confirm new password"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              {passwordError && (
                <div id="password-error" className="text-red-500 text-sm" role="alert">{passwordError}</div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={handlePasswordUpdate} 
                  disabled={passwordLoading}
                  className={`px-6 py-3 rounded-lg font-medium ${passwordLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  onClick={() => {
                    setEditingPassword(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setTempPassword('');
                    setConfirmPassword('');
                    setCurrentPassword('');
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                  }} 
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock size={20} className="text-gray-500 mr-3" />
                <span className="text-gray-900 text-lg">••••••••••••</span>
              </div>
              <button 
                onClick={() => {
                  setEditingPassword(true);
                  setPasswordSuccess('');
                  setPasswordError('');
                }} 
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <Key size={16} />
                <span className="hidden sm:inline">Change Password</span>
              </button>
            </div>
          )}
          {passwordSuccess && (
            <div className="mt-2 text-green-600 text-sm">{passwordSuccess}</div>
          )}
        </div>
      </div>
    </div>
  );
};


