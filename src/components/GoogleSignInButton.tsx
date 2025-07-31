import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

interface GoogleSignInButtonProps {
  onLogin: (jwt: string, user: any) => void;
}


const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onLogin }) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      if (!accessToken) return;
      try {
        const res = await axios.post(`${API_URL}/auth/google`, { accessToken });
        const { token, user } = res.data;
        onLogin(token, user);
      } catch (err) {
        alert('Google sign-in failed');
      }
    },
    onError: () => {
      alert('Google sign-in failed');
    },
    flow: 'implicit',
  });

  return (
    <button
      onClick={() => login()}
      className="text-[#e5e7eb] border font-semibold py-2 px-4 w-full sm:w-auto transition-colors duration-150 flex items-center gap-2 justify-center whitespace-nowrap min-w-max bg-transparent hover:bg-transparent hover:text-[#e5e7eb]"
      style={{ borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: '#e5e7eb', background: 'transparent' }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_17_40)">
          <path d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24V29H37.1C36.5 32.1 34.4 34.7 31.5 36.3V42H39C44.1 37.3 47.5 31.4 47.5 24.5Z" fill="#4285F4"/>
          <path d="M24 48C30.6 48 36.2 45.7 39.9 42.1L31.5 36.3C29.6 37.5 27.1 38.3 24 38.3C17.7 38.3 12.2 34.2 10.3 28.7H2.6V34.7C6.3 41.1 14.4 48 24 48Z" fill="#34A853"/>
          <path d="M10.3 28.7C9.7 26.6 9.7 24.4 10.3 22.3V16.3H2.6C0.5 20.1 0.5 24.9 2.6 28.7L10.3 28.7Z" fill="#FBBC05"/>
          <path d="M24 9.7C27.1 9.7 29.6 10.7 31.5 12.2L39.9 6.1C36.2 2.5 30.6 0.2 24 0.2C14.4 0.2 6.3 7.1 2.6 13.5L10.3 19.5C12.2 14 17.7 9.7 24 9.7Z" fill="#EA4335"/>
        </g>
        <defs>
          <clipPath id="clip0_17_40">
            <rect width="48" height="48" fill="white"/>
          </clipPath>
        </defs>
      </svg>
      <span>Sign in with Google</span>
    </button>
  );
};

export default GoogleSignInButton;
