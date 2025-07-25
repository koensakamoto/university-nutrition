import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login');
        return;
      }

      if (!token) {
        navigate('/login');
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
          // Check auth status to update context
          await checkAuth();
          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  );
};

export default AuthCallback;