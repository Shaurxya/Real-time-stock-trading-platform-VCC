import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import { UserProvider } from './context/UserContext';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'portfolio':
        return <Portfolio />;
      case 'orders':
        return <Orders />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <UserProvider>
      <div className="min-h-screen bg-surface-secondary dark:bg-dark-bg transition-colors duration-300">
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="max-w-[1400px] mx-auto px-6 py-6">
          {renderPage()}
        </main>
      </div>
    </UserProvider>
  );
};

export default App;
