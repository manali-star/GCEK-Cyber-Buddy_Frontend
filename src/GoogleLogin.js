import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const GoogleLogin = ({ onSuccess, onError }) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
          token: tokenResponse.access_token,
        }, {
          headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
          }
        });
        onSuccess(res.data.token);
      } catch (err) {
        onError(err.response?.data?.message || 'Google login failed');
      }
    },
    onError: (error) => {
      onError('Google login failed. Please try again.');
      console.error('Google Login Error:', error);
    },
    scope: 'profile email',
  });

  return (
    <button 
      onClick={() => login()} 
      className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded"
    >
      <img 
        src="https://www.google.com/favicon.ico" 
        alt="Google" 
        className="w-5 h-5"
      />
      Continue with Google
    </button>
  );
};

export default GoogleLogin;