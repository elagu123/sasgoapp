import React from 'react';
import { NavLink } from 'react-router-dom';
import OfflineIndicator from './OfflineIndicator.tsx';
import ThemeToggle from './ThemeToggle.tsx';
import ProfileDropdown from './ProfileDropdown.tsx';
import { dashboardFilterStore } from '../state/dashboardFilters.ts';

const Header: React.FC = () => {
  const linkStyle = "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors";
  const activeLinkStyle = "text-blue-600 dark:text-blue-400 font-semibold";
  
  const [searchQuery, setSearchQuery] = React.useState(dashboardFilterStore.getState().searchQuery);

  React.useEffect(() => {
      const unsubscribe = dashboardFilterStore.subscribe(() => {
          setSearchQuery(dashboardFilterStore.getState().searchQuery);
      });
      return unsubscribe;
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      dashboardFilterStore.setSearchQuery(e.target.value);
  };

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <NavLink to="/app/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
              SAS Go
            </NavLink>
            <nav className="hidden md:flex items-center space-x-6">
              <NavLink to="/app/dashboard" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
                Dashboard
              </NavLink>
              <NavLink to="/app/getaway-planner" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
                Escapadas
              </NavLink>
              <NavLink to="/app/packing" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
                Listas
              </NavLink>
              <NavLink to="/app/gear" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
                Mi Equipaje
              </NavLink>
            </nav>
          </div>
          
          <div className="hidden md:flex flex-1 items-center justify-center px-4">
            <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    id="search-trip"
                    name="search-trip"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Buscar por título o destino..."
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    aria-label="Buscar viaje"
                />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <OfflineIndicator />
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;