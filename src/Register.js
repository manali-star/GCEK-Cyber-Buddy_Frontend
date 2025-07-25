import React, { useState } from 'react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

function Register({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/register`, {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      onAuth(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info using the access token
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        // Send user info to your backend with isRegistering flag
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          isRegistering: true
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

        onAuth(res.data.token);
      } catch (err) {
        const errorMessage = err.response?.data?.error
          ? `Google registration failed: ${err.response.data.error}`
          : err.response?.data?.message || 'Google registration failed. Please try again.';
        setError(errorMessage);
        console.error('Google Registration Error:', err);
      }
    },
    onError: (error) => {
      setError('Google registration failed. Please try again.');
      console.error('Google Registration Error:', error);
    },
    scope: 'openid profile email'
  });

  return (
    <div className="max-w-md mx-auto p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-2xl transition-colors">
      <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

      <form onSubmit={handleRegister} className="space-y-4">
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
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          Register
        </button>
      </form>

      <div className="my-4 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-500">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <button
        onClick={handleGoogleRegister}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-5 h-5"
        />
        Continue with Google
      </button>

      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

      <p className="mt-4 text-center">
        Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login here</a>
      </p>
    </div>
  );
}

export default Register;