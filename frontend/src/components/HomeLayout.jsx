import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function HomeLayout({ isLoggedIn, onLogout }) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header isLoggedIn={isLoggedIn} onLogout={onLogout}/>
            <main className="flex-grow w-full flex">
                <Outlet />
            </main>
        </div>
    )
}