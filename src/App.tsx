// src/App.tsx ← FINAL FIXED — NO OVERLAP
import React from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SidebarSurgeon from './components/SidebarSurgeon';

function App() {
  const userJson = localStorage.getItem('current_user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!user) {
    return <LoginPage />;
  }

  const isSupport = user?.isSupport === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d2e2eb] to-cyan-50">
      <Header user={user} />

      {/* SIDEBAR */}
      {isSupport ? <Sidebar /> : <SidebarSurgeon />}

      {/* MAIN CONTENT — PROPER SPACING */}
      <main className={isSupport 
        ? "ml-64 pt-20 px-6" 
        : "ml-80 pt-20 px-6"  /* 80 = w-80 sidebar width */
      }>
        <Dashboard user={user} />
      </main>
    </div>
  );
}

export default App;