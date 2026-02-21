import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../../services/api';

const SignupForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post('api/users/register/', formData);
      navigate('/login');
    } catch (error) {
      console.log(error.response?.data);
      alert("Registration failed");
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">

      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create an account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#1E3A8A] hover:text-blue-800 transition-colors">
            log in here
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">

        <div className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="username"
                type="text"
                required
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="email"
                type="email"
                required
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                onChange={handleChange}
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

        </div>

        <button
          type="submit"
          className="hover:cursor-pointer w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-white bg-[#1E3A8A]"
        >
          Create Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>

      </form>
    </div>
  );
};

export default SignupForm;
