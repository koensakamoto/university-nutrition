import React, { useState } from 'react';
import { Pencil, Info, Mail, User } from 'lucide-react';

export const AccountSection = () => {
  const [name, setName] = useState('Koen Sakamoto');
  const [email, setEmail] = useState('koensakamoto6@gmail.com');
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempEmail, setTempEmail] = useState(email);

  const handleNameUpdate = () => {
    setName(tempName);
    setEditingName(false);
  };

  const handleEmailUpdate = () => {
    setEmail(tempEmail);
    setEditingEmail(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Account Information</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center mb-3 md:mb-0">
            <div className="h-16 w-16 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-2xl font-bold mr-4">
              {name.split(' ').map(part => part[0]).join('')}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">{name}</h3>
              <p className="text-gray-500 text-sm">Campus Meal Plan: Premium</p>
            </div>
          </div>
          <div className="bg-green-50 px-3 py-1 rounded-full text-green-600 text-sm font-medium inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            Active Account
          </div>
        </div>

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
                className="text-[#c41e3a] hover:text-[#a41930] flex items-center"
              >
                <Pencil size={16} className="mr-1" />
                Pencil
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
                className="text-[#c41e3a] hover:text-[#a41930] flex items-center"
              >
                <Pencil size={16} className="mr-1" />
                Pencil
              </button>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">University ID</label>
          <div className="flex items-center">
            <div className="flex items-center">
              <span className="bg-gray-100 text-gray-500 px-3 py-2 rounded-l border border-gray-300">ID</span>
              <input 
                type="text" 
                value="05923781" 
                disabled
                className="bg-gray-50 border border-gray-300 border-l-0 rounded-r px-3 py-2 text-gray-500 w-48"
              />
            </div>
            <span className="ml-2 text-sm text-gray-500">Contact university admin to update</span>
          </div>
        </div>
      </div>
    </div>
  );
};


