import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchProfile } = useAuth();

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
          // Small delay to ensure cookie is set before checking auth
          await new Promise(resolve => setTimeout(resolve, 100));
          // Check auth status to update context
          await refetchProfile();
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
  }, [searchParams, navigate, refetchProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default AuthCallback;