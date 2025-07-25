import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        setStatus('Authentication failed. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!token) {
        setStatus('No authentication token found. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // Exchange URL token for secure httpOnly cookie
        const response = await fetch('/auth/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          setStatus('Authentication successful! Redirecting...');
          // Check auth status to update context
          await checkAuth();
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          throw new Error('Token exchange failed');
        }
      } catch (error) {
        console.error('Token exchange error:', error);
        setStatus('Authentication failed. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Completing Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status}
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;