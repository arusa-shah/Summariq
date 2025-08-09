import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await axios.post('http://localhost:8000/api/signup/', {
        username,
        email,
        password,
        password2,
      });
      setSuccess('Signup successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      let msg = 'Signup failed. ';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') msg += err.response.data;
        else msg += Object.values(err.response.data).flat().join(' ');
      }
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pastelPink">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md border-2 border-pastelBlue">
        <h2 className="text-3xl font-bold mb-6 text-pastelBlue text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-pastelBlue font-semibold mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-pastelBlue focus:outline-none focus:ring-2 focus:ring-pastelPurple" />
          </div>
          <div>
            <label className="block text-pastelBlue font-semibold mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-pastelBlue focus:outline-none focus:ring-2 focus:ring-pastelPurple" />
          </div>
          <div>
            <label className="block text-pastelBlue font-semibold mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-pastelBlue focus:outline-none focus:ring-2 focus:ring-pastelPurple pr-10" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-pastelPurple text-sm font-semibold focus:outline-none">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-pastelBlue font-semibold mb-1">Confirm Password</label>
            <div className="relative">
              <input type={showPassword2 ? "text" : "password"} value={password2} onChange={e => setPassword2(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-pastelBlue focus:outline-none focus:ring-2 focus:ring-pastelPurple pr-10" />
              <button type="button" onClick={() => setShowPassword2(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-pastelPurple text-sm font-semibold focus:outline-none">
                {showPassword2 ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && <div className="text-red-500 text-center">{error}</div>}
          {success && <div className="text-green-500 text-center">{success}</div>}
          <button type="submit" className="w-full py-2 rounded-lg bg-pastelBlue text-white font-bold hover:bg-pastelPurple transition">Sign Up</button>
        </form>
        <p className="mt-4 text-center text-pastelBlue">Already have an account? <Link to="/login" className="text-pastelPurple font-semibold hover:underline">Login</Link></p>
      </div>
    </div>
  );
}

export default Signup; 