import Header from './Header'
import Dashboard from './Dashboard'

export default function HomeLayout() {
    return (
        <div className="bg-gray-100 min-h-screen">
            <Header isLoggedIn={true} onLogout={true}/>
            <Dashboard />
        </div>
    )
}