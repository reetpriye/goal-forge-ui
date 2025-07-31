import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

interface GoogleSignInButtonProps {
  onLogin: (jwt: string, user: any) => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onLogin }) => {
  return (
    <GoogleLogin
      onSuccess={async credentialResponse => {
        const idToken = credentialResponse.credential;
        if (!idToken) return;
        try {
          const res = await axios.post('http://localhost:8080/auth/google', { idToken });
          const { token, user } = res.data;
          onLogin(token, user);
        } catch (err) {
          alert('Google sign-in failed');
        }
      }}
      onError={() => {
        alert('Google sign-in failed');
      }}
      useOneTap
    />
  );
};

export default GoogleSignInButton;
