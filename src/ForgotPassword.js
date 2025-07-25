import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ForgotPassword({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}//api/auth/forgot-password`, { email }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      setMessage('If this email exists, a reset link has been sent.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error sending reset link.');
    }
  };

  return (
    <div className="min-h-[635px] flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 text-center max-w-3xl tracking-tight drop-shadow-lg">
        <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
          AI Chatbot: Cybercrime Support
        </span>
      </h1>
      <h6 className="sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 text-center">
        "A software developed to educate and protect users from cybercrime while offering seamless support!"
      </h6>
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-2xl transition-colors">
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full px-4 py-2 border rounded-md focus:outline-none  :ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700" />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
            Send Reset Link
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
        <button onClick={() => navigate('/login')} className="w-full mt-4 text-blue-500 hover:underline text-center">
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;