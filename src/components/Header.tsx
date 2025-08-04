import React from 'react';
import Logo from './Logo';
import GoogleSignInButton from './GoogleSignInButton';

interface HeaderProps {
  user?: { name?: string };
  onLogin?: (token: string, userObj: any) => void;
  onLogout?: () => void;
  serverReady?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout }) => (
  <div className="flex flex-row items-center justify-between w-full mb-6 pb-0 gap-3">
    <div className="flex items-center gap-2 sm:gap-3">
      <Logo />
    </div>
    <div className="flex items-center gap-2 flex-nowrap">
      <div className="flex flex-row items-center gap-2 whitespace-nowrap">
        {user ? (
          <>
            <span className="font-semibold">{user.name}</span>
            <button className="ml-2 p-2 rounded border-2 font-semibold transition-colors" style={{ borderColor: 'var(--color-accent)' }} onClick={onLogout}>Sign out</button>
          </>
        ) : (
          <GoogleSignInButton onLogin={onLogin ?? (() => {})} />
        )}
      </div>
    </div>
  </div>
);

export default Header;
