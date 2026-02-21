import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/feedback/Loader';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    localStorage.clear();

    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader />
      <div className="mt-8 text-center animate-pulse">
        <h2 className="text-xl font-bold text-gray-900">
          Terminating Session
        </h2>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          Please wait while we securely log you out...
        </p>
      </div>
    </div>
  );
};

export default Logout;
