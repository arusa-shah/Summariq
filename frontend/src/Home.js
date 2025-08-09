import axios from 'axios';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SUMMARY_DISPLAY_THRESHOLD = 1000; // characters
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

function Home() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [autoEmail, setAutoEmail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!localStorage.getItem('access')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes('.' + ext)) {
        setError('Invalid file type. Only PDF and DOCX are allowed.');
        setFile(null);
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
    setSummary('');
    setShowSummary(false);
    setAutoEmail(false);
    setUploadProgress(0);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSummary('');
    setShowSummary(false);
    setAutoEmail(false);
    setUploadProgress(0);
    if (!file) {
      setError('Please select a file.');
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://localhost:8000/api/upload/', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access')}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      setUploadProgress(100);
      const summaryText = response.data.summary;
      setSummary(summaryText);
      if (summaryText.length <= SUMMARY_DISPLAY_THRESHOLD) {
        setShowSummary(true);
        setAutoEmail(true);
      } else {
        setShowSummary(false);
        setAutoEmail(true);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || 'Server error. Please try again later.');
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Unexpected error occurred.');
      }
    }
    setLoading(false);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  React.useEffect(() => {

    if (autoEmail && summary) {
      handleSendEmail();
      setAutoEmail(false);
    }

  }, [autoEmail, summary]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    setEmailStatus('');
    if (!email) {
      setEmailStatus('Please enter an email address.');
      return;
    }
  
    try {
      const response = await fetch("http://127.0.0.1:8000/api/email/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access')}`,
        },
        body: JSON.stringify({
          email,
          summary
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setEmailStatus(errorData?.error || 'Failed to send summary.');
        return;
      }
  
      setEmailStatus('Summary sent! Check your email for a PDF attachment.');
    } catch (err) {
      setEmailStatus('Network or server error. Try again.');
    }
  };
  

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastelBlue via-pastelPink to-pastelPurple flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg p-8 border-4 border-pastelPurple/60 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-pastelPurple drop-shadow">SummarIQ</h2>
          <div className="flex gap-2">
            <button onClick={() => navigate('/profile')} aria-label="Go to profile page" className="text-pastelBlue font-semibold hover:underline hover:text-pastelPurple transition">Profile</button>
            <button onClick={handleLogout} aria-label="Logout" className="text-pastelPink font-semibold hover:underline hover:text-pastelPurple transition">Logout</button>
          </div>
        </div>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            ref={fileInputRef}
            aria-label="Upload PDF or DOCX"
            className="block w-full text-pastelPurple file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pastelBlue file:text-pastelPurple hover:file:bg-pastelPink border-2 border-pastelBlue/40 shadow-sm"
          />
          <input
            type="email"
            placeholder="Enter email to send summary"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-label="Email address to send summary"
            className="w-full px-4 py-2 rounded-lg border-2 border-pastelBlue/60 focus:outline-none focus:ring-2 focus:ring-pastelPurple bg-pastelYellow/40 shadow-sm"
            required
          />
          {uploadProgress > 0 && (
            <div className="w-full bg-pastelYellow rounded-lg h-3 overflow-hidden">
              <div
                className="h-3 bg-pastelGreen transition-all duration-300 rounded-lg shadow"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          <button
            type="submit"
            aria-label="Upload and Summarize"
            className="w-full py-2 rounded-lg bg-pastelPurple text-white font-bold hover:bg-pastelPink hover:text-pastelPurple border-2 border-pastelBlue/40 shadow transition"
            disabled={loading}
          >
            {loading ? 'Summarizing...' : 'Upload & Summarize'}
          </button>
        </form>
        {error && <div className="text-red-500 text-center mt-2 font-semibold drop-shadow">{error}</div>}
        {emailStatus && <div className="text-center text-pastelPurple mt-2 font-semibold drop-shadow">{emailStatus}</div>}
        {showSummary && summary && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-pastelBlue mb-2 drop-shadow">Summary</h3>
            <textarea
              className="w-full h-40 p-3 rounded-2xl border-4 border-pastelBlue/60 bg-pastelYellow text-pastelPurple font-mono mb-4 resize-none shadow-lg focus:ring-2 focus:ring-pastelPurple"
              value={summary}
              readOnly
              aria-label="Summary text area"
            />
            <div className="flex flex-wrap gap-3 mb-4">
              <button onClick={handleCopy} aria-label="Copy summary to clipboard" className="px-4 py-2 rounded-lg bg-pastelBlue text-white font-bold hover:bg-pastelPurple hover:text-pastelYellow border-2 border-pastelPurple/40 shadow transition">Copy</button>
              <button onClick={handleDownload} aria-label="Download summary as text file" className="px-4 py-2 rounded-lg bg-pastelPink text-white font-bold hover:bg-pastelPurple hover:text-pastelYellow border-2 border-pastelPurple/40 shadow transition">Download</button>
            </div>
          </div>
        )}
        {!showSummary && summary && (
          <div className="mt-8 text-center text-pastelPurple font-semibold drop-shadow">
            The summary is too long to display here. It has been sent to your email.
          </div>
        )}
      </div>
    </div>
  );
}

export default Home; 