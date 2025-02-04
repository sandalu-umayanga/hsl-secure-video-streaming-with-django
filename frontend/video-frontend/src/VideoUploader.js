import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Hls from 'hls.js';

const VideoUploader = () => {
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [manifestUrl, setManifestUrl] = useState('');
  const videoRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !email) return;

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
      // The response contains the video instance including hls_manifest
      const { hls_manifest } = response.data;
      if (!hls_manifest) {
        console.error("No hls_manifest returned from API");
        return;
      }
      // Construct full URL to the manifest (adjust domain/port as necessary)
      setManifestUrl(`http://localhost:8000/media/${hls_manifest}`);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

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

  return (
    <div>
      <h1>Upload and Watch Your Video</h1>
      <form onSubmit={handleUpload}>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Email (for watermark):</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Video File:</label>
          <input type="file" onChange={handleFileChange} accept="video/*" required />
        </div>
        <button type="submit">Upload Video</button>
      </form>

      {manifestUrl && (
        <div>
          <h2>Processed Video</h2>
          <video ref={videoRef} controls style={{ width: '600px' }} />
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
