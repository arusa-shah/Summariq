import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/login/', {
        username,
        password,
      });
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      navigate('/home');
    } catch (err) {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pastelBlue">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md border-2 border-pastelPurple">
        <h2 className="text-3xl font-bold mb-6 text-pastelPurple text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-pastelPurple font-semibold mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-pastelPurple focus:outline-none focus:ring-2 focus:ring-pastelPink" />
          </div>
          <div>
            <label className="block text-pastelPurple font-semibold mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-pastelPurple focus:outline-none focus:ring-2 focus:ring-pastelPink" />
          </div>
          {error && <div className="text-red-500 text-center">{error}</div>}
          <button type="submit" className="w-full py-2 rounded-lg bg-pastelPurple text-white font-bold hover:bg-pastelPink transition">Login</button>
        </form>
        <p className="mt-4 text-center text-pastelPurple">Don't have an account? <Link to="/signup" className="text-pastelPink font-semibold hover:underline">Sign up</Link></p>
      </div>
    </div>
  );
}

export default Login; 