import React from 'react'
import { Link } from 'react-router-dom'
import { UserIcon, SettingsIcon, BookmarkIcon, LogOutIcon } from 'lucide-react'
const ProfileMenu = ({ onLogout }) => {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
      <Link
        to="/profile"
        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
      >
        <UserIcon size={16} className="mr-2" />
        <span>My Profile</span>
      </Link>
      <Link
        to="/saved-meals"
        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
      >
        <BookmarkIcon size={16} className="mr-2" />
        <span>Saved Meals</span>
      </Link>
      <Link
        to="/settings"
        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
      >
        <SettingsIcon size={16} className="mr-2" />
        <span>Preferences</span>
      </Link>
      <div className="border-t border-gray-200 mt-1">
        <button
          onClick={onLogout}
          className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          <LogOutIcon size={16} className="mr-2" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
export default ProfileMenu
