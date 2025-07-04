import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Info, Mail, User, Camera } from 'lucide-react';
import { AccountInfoToolTip } from './AccountInfoToolTip';
import { useAuth, useFetchWithAuth } from '../../AuthProvider';

export const AccountSection = () => {
  const { user } = useAuth();
  const fetchWithAuth = useFetchWithAuth();
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

  const handleSave = async () => {
    let imageUrl = image; // current image
    if (tempImage) {
      const formData = new FormData();
      formData.append("image", tempImage);
      const { data, error } = await fetchWithAuth("/api/profile/image", {
        method: "POST",
        body: formData,
      });
      if (error || !data) throw new Error('Failed to upload image');
      imageUrl = data.url;
    }
    // Save the profile with the new imageUrl and other fields
    await saveProfile({ ...otherFields, image: imageUrl });
    setPreviewImage(null);
    setTempImage(null);
  };

  // Helper to get the correct image URL
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/static/')) {
      return `http://localhost:8000${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-gray-600">Loading account info...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Account Information</h2>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowTooltip(true)}
            aria-label="Show account info"
          >
            <Info size={16} />
          </button>
        </div>
      </div>
      <AccountInfoToolTip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="info"
      />
      
      <div className="space-y-6">  
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center mb-3 md:mb-0">
            <div className="flex items-center">
              <div className="relative w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
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
                  className="absolute bottom-2 right-2 bg-white border border-gray-300 rounded-full p-2 shadow-md flex items-center justify-center hover:bg-gray-100"
                  onClick={handleImageUploadClick}
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              
              <span className="ml-4 text-2xl font-semibold text-gray-800">{name}</span>
            </div>
          </div>
          <div className="bg-green-50 px-3 py-1 rounded-full text-green-600 text-sm font-medium inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            Active Account
          </div>
        </div>

        {previewImage && (
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={handleImageUpload}
              className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
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

        <div>
          <label className="block text-gray-700 font-medium mb-2">Name</label>
          {editingName ? (
            <div className="flex items-center">
              <input 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
              />
              <button 
                onClick={handleNameUpdate} 
                className="ml-2 bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
              >
                Save
              </button>
              <button 
                onClick={() => {
                  setTempName(name);
                  setEditingName(false);
                }} 
                className="ml-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User size={18} className="text-gray-400 mr-2" />
                <span className="text-gray-800">{name}</span>
              </div>
              <button
                onClick={() => setEditingName(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Edit Name"
                title="Edit Name"
              >
                <Pencil size={18} className="text-[#c41e3a]" />
              </button>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          {editingEmail ? (
            <div className="flex items-center">
              <input 
                type="email" 
                value={tempEmail} 
                onChange={(e) => setTempEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
              />
              <button 
                onClick={handleEmailUpdate} 
                className="ml-2 bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
              >
                Save
              </button>
              <button 
                onClick={() => {
                  setTempEmail(email);
                  setEditingEmail(false);
                }} 
                className="ml-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail size={18} className="text-gray-400 mr-2" />
                <span className="text-gray-800">{email}</span>
              </div>
              <button
                onClick={() => setEditingEmail(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Edit Email"
                title="Edit Email"
              >
                <Pencil size={18} className="text-[#c41e3a]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


