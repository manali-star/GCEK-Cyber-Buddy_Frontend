import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';

function Login({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Handle password reset success message
  useEffect(() => {
    if (location.state?.passwordReset) {
      setSuccessMessage('Password reset successful! Please login with your new password.');
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
      {
        email,
        password,
      },
      {
        withCredentials: true, // ✅ Important for cookies/sessions
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    onAuth(res.data.token);
  } catch (err) {
    setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

  const handleGoogleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    try {
      // Get user info using the access token
      const userInfo = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      );

      // Send user info to your backend
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`,
        {
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
        },
        {
          withCredentials: true, // ✅ Required for cross-origin cookies/sessions
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      onAuth(res.data.token);
    } catch (err) {
      if (err.response?.data?.code === 'GOOGLE_ACCOUNT_NOT_REGISTERED') {
        setError('This Google account is not registered. Please sign up first.');
      } else {
        setError(err.response?.data?.message || 'Google login failed. Please try again.');
      }
      console.error('Google Login Error:', err);
    }
  },
  onError: (error) => {
    setError('Google login failed. Please try again.');
    console.error('Google Login Error:', error);
  },
  scope: 'openid profile email'
});


  return (
    <div className="max-w-md mx-auto p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-2xl transition-colors">
      <h2 className="text-2xl font-bold text-center mb-2">Login</h2>

      {/* Success message for password reset */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          Login
        </button>
      </form>

      <div className="my-4 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-500">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-5 h-5"
        />
        Continue with Google
      </button>

      <p className="text-center mt-4">
        <button
          onClick={() => navigate('/forgot-password')}
          className="text-blue-500 hover:underline bg-transparent border-none cursor-pointer"
        >
          Forgot Password?
        </button>
      </p>

      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

      <p className="text-center mt-4">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/register')}
          className="text-blue-500 hover:underline bg-transparent border-none cursor-pointer"
        >
          Register here
        </button>
      </p>
    </div>
  );
}

export default Login;