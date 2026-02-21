import React from 'react';
import LoginForm from '../../features/auth/components/LoginForm';


const Login = () => {
  return (
    <div className="min-h-screen flex bg-white">

      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <LoginForm />
        </div>
      </div>

      <div className="hidden lg:block relative w-0 flex-1 bg-blue-900">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-blue-900 opacity-90 z-10"></div>
        <img
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Modern Building"
        />

        <div className="absolute bottom-0 left-0 right-0 p-20 z-20 text-white">
          <h2 className="text-4xl font-bold mb-4">Building Better Communities</h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-lg">
            Join thousands of citizens making a difference. Report issues, track progress, and see your city improve in real-time.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;