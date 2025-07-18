import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MenuIcon,
  XIcon,
  UserIcon,
  LogOutIcon,
  SettingsIcon,
  BookmarkIcon,
  ChartBarBig,
  Settings,
  LayoutDashboard

} from 'lucide-react'
import ProfileMenu from './ProfileMenu'
import ULogo from "../images/ULogo.png"
import { useAuth } from '../AuthProvider'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen)
  }
  return (
    <header className="bg-red-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img
              src={ULogo}
              alt="University Logo"
              className="w-10 h-10 pt-1 "
            />
            <h1 className="text-xl font-bold">Campus Nutrition</h1>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {/* Only show Dashboard if not guest */}
                {!user.guest && (
                  <Link to="dashboard" className="hover:text-red-200 flex items-center">
                    <LayoutDashboard className="mr-2" size={20} />
                    Dashboard
                  </Link>
                )}
                {/* Only show these links if not guest */}
                {!user.guest && (
                  <>
                    <Link to="history" className="hover:text-red-200 flex items-center">
                      <ChartBarBig className="mr-2" size={20} />
                      Nutrition History
                    </Link>
                    <Link to="profile" className="hover:text-red-200 flex items-center">
                      <UserIcon className="mr-2" size={20} />
                      Profile
                    </Link>
                    <Link to="account" className="hover:text-red-200 flex items-center">
                      <Settings className="mr-2" size={20} />
                      Account
                    </Link>
                  </>
                )}
                {/* Show Sign In for guest, Sign Out for authenticated */}
                {user.guest ? (
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100"
                  >
                    Sign In
                  </button>
                ) : (
                  <button
                    className="flex items-center space-x-2 py-2 hover:text-red-200"
                    onClick={logout}
                  >
                    <LogOutIcon size={18} />
                    <span>Sign Out</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100"
              >
                Sign In
              </button>
            )}
          </nav>
          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-3 pb-3 space-y-3">
            {user ? (
              <>
                {/* Only show Dashboard if not guest */}
                {!user.guest && (
                  <Link
                    to="dashboard"
                    className="flex py-2 hover:text-red-200"
                  >
                    <LayoutDashboard className="mr-2" size={20} />
                    Dashboard
                  </Link>
                )}
                {/* Only show these links if not guest */}
                {!user.guest && (
                  <>
                    <Link
                      to="history"
                      className="flex py-2 hover:text-red-200"
                    >
                      <ChartBarBig className="mr-2" size={20} />
                      Nutrition History
                    </Link>
                    <Link
                      to="profile"
                      className="flex py-2 hover:text-red-200"
                    >
                      <UserIcon className="mr-2" size={20} />
                      Profile
                    </Link>
                    <Link
                      to="account"
                      className="flex py-2 hover:text-red-200"
                    >
                      <Settings className="mr-2" size={20} />
                      Account
                    </Link>
                  </>
                )}
                <div className="border-t border-red-500 pt-2 mt-2">
                  {/* Show Sign In for guest, Sign Out for authenticated */}
                  {user.guest ? (
                    <button
                      onClick={async () => {
                        await logout();
                        navigate('/login');
                      }}
                      className="block bg-white text-red-600 px-4 py-2 rounded-md font-medium text-center hover:bg-red-100 w-full"
                    >
                      Sign In
                    </button>
                  ) : (
                    <button
                      className="flex items-center space-x-2 py-2 hover:text-red-200"
                      onClick={logout}
                    >
                      <LogOutIcon size={18} />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="block bg-white text-red-600 px-4 py-2 rounded-md font-medium text-center hover:bg-red-100 w-full"
              >
                Sign In
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
export default Header
