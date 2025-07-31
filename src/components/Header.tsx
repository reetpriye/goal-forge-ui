import React from 'react';
import Logo from '../Logo';

interface HeaderProps {
  seedInitialData: () => void;
}

const Header: React.FC<HeaderProps> = ({ seedInitialData }) => (
  <div className="flex items-center justify-between mb-6 border-b pb-4">
    <div className="flex items-center gap-3">
      <Logo />
      <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: '#60a5fa' }}>Goal Forge</h1>
    </div>
    <button onClick={seedInitialData} className="bg-gradient-to-r from-green-500 to-green-700 text-white px-5 py-2 rounded-lg shadow hover:scale-105 transition-transform">Seed Initial Data</button>
  </div>
);

export default Header;
