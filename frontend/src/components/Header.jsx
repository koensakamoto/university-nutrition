import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
                <Link to="dashboard" className="hover:text-red-200 flex items-center">
                  <LayoutDashboard className="mr-2" size={20} />
                  Dashboard
                </Link>

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

                <Link to="login"  className="hover:text-red-200 flex items-center">
                  <button
                    className="flex items-center space-x-2 py-2 hover:text-red-200"
                    onClick={logout}
                  >
                    <LogOutIcon size={18} />
                    <span>Sign Out</span>
                  </button>         
                </Link>



                {/* <div className="relative">
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-1 hover:text-red-200"
                  >
                    <UserIcon size={20} />
                    <span>Profile</span>
                  </button>
                  {profileMenuOpen && <ProfileMenu onLogout={onLogout} />}
                </div> */}
              </>
            ) : (
              <Link
                to="login"
                className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100"
              >
                Sign In
              </Link>
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
                <Link
                  to="dashboard"
                  className="flex py-2 hover:text-red-200"
                >
                  <LayoutDashboard className="mr-2" size={20} />
                  Dashboard
                </Link>
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
                <div className="border-t border-red-500 pt-2 mt-2">
                  <button
                    className="flex items-center space-x-2 py-2 hover:text-red-200"
                    onClick={logout}
                  >
                    <LogOutIcon size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="login"
                className="block bg-white text-red-600 px-4 py-2 rounded-md font-medium text-center hover:bg-red-100"
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
export default Header
