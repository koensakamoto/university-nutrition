// import React, { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import {
//   MenuIcon,
//   XIcon,
//   UserIcon,
//   LogOutIcon,
//   SettingsIcon,
//   BookmarkIcon,
//   ChartBarBig,
//   Settings,
//   LayoutDashboard

// } from 'lucide-react'
// import ProfileMenu from './ProfileMenu'
// import ULogo from "../images/ULogo.png"
// import { useAuth } from '../AuthProvider'

// const Header = () => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
//   const [profileMenuOpen, setProfileMenuOpen] = useState(false)
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const toggleMobileMenu = () => {
//     setMobileMenuOpen(!mobileMenuOpen)
//   }
//   const toggleProfileMenu = () => {
//     setProfileMenuOpen(!profileMenuOpen)
//   }
//   return (
//     <header className="bg-red-600 text-white shadow-md">
//       <div className="container mx-auto px-4 py-2">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <img
//               src={ULogo}
//               alt="University Logo"
//               className="w-10 h-10 pt-1 "
//             />
//             <h1 className="text-xl font-bold">Campus Nutrition</h1>
//           </div>
//           {/* Desktop Navigation */}
//           <nav className="hidden md:flex items-center space-x-6">
//             {user ? (
//               <>
//                 {/* Only show Dashboard if not guest */}
//                 {!user.guest && (
//                   <Link to="dashboard" className="hover:text-red-200 flex items-center">
//                     <LayoutDashboard className="mr-2" size={20} />
//                     Dashboard
//                   </Link>
//                 )}
//                 {/* Only show these links if not guest */}
//                 {!user.guest && (
//                   <>
//                     <Link to="history" className="hover:text-red-200 flex items-center">
//                       <ChartBarBig className="mr-2" size={20} />
//                       Nutrition History
//                     </Link>
//                     <Link to="profile" className="hover:text-red-200 flex items-center">
//                       <UserIcon className="mr-2" size={20} />
//                       Profile
//                     </Link>
//                     <Link to="account" className="hover:text-red-200 flex items-center">
//                       <Settings className="mr-2" size={20} />
//                       Account
//                     </Link>
//                   </>
//                 )}
//                 {/* Show Sign In for guest, Sign Out for authenticated */}
//                 {user.guest ? (
//                   <button
//                     onClick={async () => {
//                       await logout();
//                       navigate('/login');
//                     }}
//                     className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100"
//                   >
//                     Sign In
//                   </button>
//                 ) : (
//                   <button
//                     className="flex items-center space-x-2 py-2 hover:text-red-200"
//                     onClick={logout}
//                   >
//                     <LogOutIcon size={18} />
//                     <span>Sign Out</span>
//                   </button>
//                 )}
//               </>
//             ) : (
//               <button
//                 onClick={() => navigate('/login')}
//                 className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100"
//               >
//                 Sign In
//               </button>
//             )}
//           </nav>
//           {/* Mobile Menu Button */}
//           <button className="md:hidden" onClick={toggleMobileMenu}>
//             {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
//           </button>
//         </div>
//         {/* Mobile Navigation */}
//         {mobileMenuOpen && (
//           <nav className="md:hidden mt-3 pb-3 space-y-3">
//             {user ? (
//               <>
//                 {/* Only show Dashboard if not guest */}
//                 {!user.guest && (
//                   <Link
//                     to="dashboard"
//                     className="flex py-2 hover:text-red-200"
//                   >
//                     <LayoutDashboard className="mr-2" size={20} />
//                     Dashboard
//                   </Link>
//                 )}
//                 {/* Only show these links if not guest */}
//                 {!user.guest && (
//                   <>
//                     <Link
//                       to="history"
//                       className="flex py-2 hover:text-red-200"
//                     >
//                       <ChartBarBig className="mr-2" size={20} />
//                       Nutrition History
//                     </Link>
//                     <Link
//                       to="profile"
//                       className="flex py-2 hover:text-red-200"
//                     >
//                       <UserIcon className="mr-2" size={20} />
//                       Profile
//                     </Link>
//                     <Link
//                       to="account"
//                       className="flex py-2 hover:text-red-200"
//                     >
//                       <Settings className="mr-2" size={20} />
//                       Account
//                     </Link>
//                   </>
//                 )}
//                 <div className="border-t border-red-500 pt-2 mt-2">
//                   {/* Show Sign In for guest, Sign Out for authenticated */}
//                   {user.guest ? (
//                     <button
//                       onClick={async () => {
//                         await logout();
//                         navigate('/login');
//                       }}
//                       className="block bg-white text-red-600 px-4 py-2 rounded-md font-medium text-center hover:bg-red-100 w-full"
//                     >
//                       Sign In
//                     </button>
//                   ) : (
//                     <button
//                       className="flex items-center space-x-2 py-2 hover:text-red-200"
//                       onClick={logout}
//                     >
//                       <LogOutIcon size={18} />
//                       <span>Sign Out</span>
//                     </button>
//                   )}
//                 </div>
//               </>
//             ) : (
//               <button
//                 onClick={() => navigate('/login')}
//                 className="block bg-white text-red-600 px-4 py-2 rounded-md font-medium text-center hover:bg-red-100 w-full"
//               >
//                 Sign In
//               </button>
//             )}
//           </nav>
//         )}
//       </div>
//     </header>
//   )
// }
// export default Header
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

// Helper function to handle image URLs
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/static/')) {
    return `http://localhost:8000${url}`;
  }
  return url;
};

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
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section - Enhanced */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md border border-gray-200">
              <img
                src={ULogo}
                alt="University Logo"
                className="w-8 h-8"
              />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">CrimsonBites</h1>
              <p className="text-gray-500 text-xs hidden sm:block font-medium">University of Utah</p>
            </div>
          </div>

          {/* Desktop Navigation - Enhanced */}
          <nav className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {/* Only show Dashboard if not guest */}
                {!user.guest && (
                  <Link
                    to="dashboard"
                    className="flex items-center px-4 py-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group font-medium"
                  >
                    <LayoutDashboard className="mr-2 group-hover:scale-110 transition-transform duration-200" size={18} />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* Only show these links if not guest */}
                {!user.guest && (
                  <>
                    <Link
                      to="history"
                      className="flex items-center px-4 py-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group font-medium"
                    >
                      <ChartBarBig className="mr-2 group-hover:scale-110 transition-transform duration-200" size={18} />
                      <span>History</span>
                    </Link>
                    <Link
                      to="profile"
                      className="flex items-center px-4 py-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group font-medium"
                    >
                      <UserIcon className="mr-2 group-hover:scale-110 transition-transform duration-200" size={18} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="account"
                      className="flex items-center px-4 py-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group font-medium"
                    >
                      <Settings className="mr-2 group-hover:scale-110 transition-transform duration-200" size={18} />
                      <span>Account</span>
                    </Link>
                  </>
                )}

                {/* Divider */}
                {!user.guest && <div className="w-px h-6 bg-gray-200 mx-3"></div>}

                {/* Show Sign In for guest, Sign Out for authenticated */}
                {user.guest ? (
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Sign In
                  </button>
                ) : (
                  <div className="flex items-center space-x-4">
                    {/* User Info */}
                    <div className="hidden lg:flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        {user.profile?.image ? (
                          <img
                            src={getImageUrl(user.profile.image)}
                            alt="User Profile"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-red-600 font-semibold text-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {/* Sign Out Button */}
                    <button
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group font-medium"
                      onClick={logout}
                    >
                      <LogOutIcon size={18} className="group-hover:scale-110 transition-transform duration-200" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile Menu Button - Enhanced */}
          <button
            className="md:hidden p-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        {/* Mobile Navigation - Enhanced */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 mt-2 bg-white">
            <nav className="py-4 space-y-2">
              {user ? (
                <>
                  {/* User Info Mobile */}
                  {!user.guest && (
                    <div className="px-4 py-4 bg-gray-50 rounded-xl mb-4 mx-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          {user.profile?.image ? (
                            <img
                              src={getImageUrl(user.profile.image)}
                              alt="User Profile"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-red-600 font-semibold text-lg">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name || 'User'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Only show Dashboard if not guest */}
                  {!user.guest && (
                    <Link
                      to="dashboard"
                      className="flex items-center px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="mr-3" size={20} />
                      <span>Dashboard</span>
                    </Link>
                  )}

                  {/* Only show these links if not guest */}
                  {!user.guest && (
                    <>
                      <Link
                        to="history"
                        className="flex items-center px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ChartBarBig className="mr-3" size={20} />
                        <span>Nutrition History</span>
                      </Link>
                      <Link
                        to="profile"
                        className="flex items-center px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserIcon className="mr-3" size={20} />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="account"
                        className="flex items-center px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="mr-3" size={20} />
                        <span>Account</span>
                      </Link>
                    </>
                  )}

                  <div className="border-t border-gray-200 pt-4 mt-4 mx-2">
                    {/* Show Sign In for guest, Sign Out for authenticated */}
                    {user.guest ? (
                      <button
                        onClick={async () => {
                          await logout();
                          navigate('/login');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                      >
                        Sign In
                      </button>
                    ) : (
                      <button
                        className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 w-full font-medium"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOutIcon size={20} className="mr-3" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-red-600 text-white px-4 py-3 mx-2 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header