import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('access')) {
      navigate('/login');
      return;
    }
    axios.get('http://localhost:8000/api/profile/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
    })
      .then(res => {
        setProfile(res.data);
        setEmail(res.data.email);
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await axios.put('http://localhost:8000/api/profile/', { email }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
      });
      setProfile(res.data);
      setStatus('Email updated!');
    } catch {
      setStatus('Failed to update email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastelBlue via-pastelPink to-pastelPurple p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 border-2 border-pastelPurple">
        <h2 className="text-3xl font-bold text-pastelPurple mb-6 text-center">Profile</h2>
        <div className="mb-4">
          <label className="block text-pastelPurple font-semibold mb-1">Username</label>
          <input type="text" value={profile.username} readOnly className="w-full px-4 py-2 rounded-lg border border-pastelPurple bg-gray-100" />
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-pastelPurple font-semibold mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-pastelPurple focus:outline-none focus:ring-2 focus:ring-pastelPink" required />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-pastelPurple text-white font-bold hover:bg-pastelPink transition">Update Email</button>
        </form>
        {status && <div className="text-center text-pastelPurple mt-4">{status}</div>}
        <button onClick={() => navigate('/home')} className="mt-6 w-full py-2 rounded-lg bg-pastelBlue text-white font-bold hover:bg-pastelPurple transition">Back to Home</button>
      </div>
    </div>
  );
}

export default Profile; 