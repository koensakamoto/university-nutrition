import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Info, Mail, User, Camera } from 'lucide-react';
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
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempImage, setTempImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const fileInputRef = useRef(null);

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
        setSaveError('Could not load account info.');
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
      setTempImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
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
    try {
      const formData = new FormData();
      formData.append('image', tempImage);
      const { data, error } = await fetchWithAuth('/api/profile/image', {
        method: 'POST',
        body: formData,
      });
      if (error || !data) throw new Error('Failed to upload image');
      const imageUrl = data.url;
      // Update profile with new image URL
      const { data: updateData, error: updateError } = await fetchWithAuth('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl })
      });
      if (updateError || !updateData) throw new Error('Failed to update profile image');
      setImage(imageUrl);
      setTempImage(null);
      setPreviewImage('');
      setImageSuccess('Profile image updated!');
    } catch (err) {
      setImageError('Could not upload image.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    setSaveError('');
    setSaveSuccess('');
    try {
      const { data, error } = await fetchWithAuth('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName })
      });
      if (error || !data) throw new Error('Failed to update name');
      setName(tempName);
      setEditingName(false);
      setSaveSuccess('Name updated!');
      // Refetch profile to update the header and other components
      refetchProfile();
    } catch (err) {
      setSaveError('Could not update name.');
    }
  };

  const handleEmailUpdate = async () => {
    setSaveError('');
    setSaveSuccess('');
    try {
      const { data, error } = await fetchWithAuth('/api/profile/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail })
      });
      if (error || !data) throw new Error('Failed to update email');
      setEmail(tempEmail);
      setEditingEmail(false);
      setSaveSuccess('Email updated!');
      navigate('/login', { replace: true });
      await logout();
      // console.log('Navigated to login');
    } catch (err) {
      setSaveError('Could not update email.');
    }
  };


  // Helper to get the correct image URL
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/static/')) {
      return url; // Proxy will handle the routing
    }
    return url;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-6">
        <div className="text-gray-600">Loading account info...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
          <button
            type="button"
            className="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleNameUpdate} 
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setTempName(name);
                    setEditingName(false);
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
                <User size={20} className="text-gray-500 mr-3" />
                <span className="text-gray-900 text-lg">{name}</span>
              </div>
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                aria-label="Edit Name"
              >
                <Pencil size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <label className="block text-gray-800 font-semibold mb-3">Email</label>
          {editingEmail ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                value={tempEmail} 
                onChange={(e) => setTempEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleEmailUpdate} 
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setTempEmail(email);
                    setEditingEmail(false);
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
                <Mail size={20} className="text-gray-500 mr-3" />
                <span className="text-gray-900 text-lg">{email}</span>
              </div>
              <button
                onClick={() => setEditingEmail(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                aria-label="Edit Email"
              >
                <Pencil size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


