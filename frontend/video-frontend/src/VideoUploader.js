import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Hls from 'hls.js';

const VideoUploader = () => {
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [manifestUrl, setManifestUrl] = useState('');
  const [videos, setVideos] = useState([]);
  const videoRef = useRef(null);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/video/videos/');
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !email) return;

    setUploading(true);
    setManifestUrl('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('email', email);
    formData.append('video_file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/video/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const { id } = response.data;
      setProcessingId(id);
      setUploading(false);
      fetchVideos(); // Refresh list (it will show as not processed yet)
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      alert('Upload failed. Please check the console for details.');
    }
  };

  // Poll for processing status
  useEffect(() => {
    let interval;
    if (processingId) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/video/videos/${processingId}/`);
          if (response.data.processed) {
            setManifestUrl(`http://localhost:8000/media/${response.data.hls_manifest}`);
            setProcessingId(null);
            fetchVideos(); // Refresh list
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Status check failed:', error);
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [processingId, fetchVideos]);

  useEffect(() => {
    if (manifestUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(manifestUrl);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = manifestUrl;
      }
    }
  }, [manifestUrl]);

  const playVideo = (hls_manifest) => {
    setManifestUrl(`http://localhost:8000/media/${hls_manifest}`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Secure HLS Video Streamer</h1>
      
      <div style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h2>Upload New Video</h2>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block' }}>Title:</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block' }}>Email (for watermark):</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block' }}>Video File:</label>
            <input type="file" onChange={handleFileChange} accept="video/*" required />
          </div>
          <button type="submit" disabled={uploading || processingId} style={{ padding: '10px 20px' }}>
            {uploading ? 'Uploading...' : processingId ? 'Processing...' : 'Upload Video'}
          </button>
        </form>
        {processingId && <p style={{ color: 'blue' }}>Video is being processed... It will appear below when ready.</p>}
      </div>

      {manifestUrl && (
        <div style={{ marginBottom: '40px' }}>
          <h2>Now Playing</h2>
          <video ref={videoRef} controls style={{ width: '100%', backgroundColor: '#000' }} />
        </div>
      )}

      <div>
        <h2>Your Videos</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {videos.map(video => (
            <li key={video.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{video.title}</strong> <br />
                <small>{video.email} - {new Date(video.uploaded_at).toLocaleString()}</small>
              </div>
              <div>
                {video.processed ? (
                  <button onClick={() => playVideo(video.hls_manifest)}>Play</button>
                ) : (
                  <span style={{ color: '#888' }}>Processing...</span>
                )}
              </div>
            </li>
          ))}
          {videos.length === 0 && <p>No videos uploaded yet.</p>}
        </ul>
      </div>
    </div>
  );
};

export default VideoUploader;