import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Hls from 'hls.js';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  ProgressBar, 
  Badge, 
  ListGroup,
  Navbar
} from 'react-bootstrap';

const VideoUploader = () => {
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [manifestUrl, setManifestUrl] = useState('');
  const [videos, setVideos] = useState([]);
  const videoRef = useRef(null);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get('/api/video/videos/');
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
    setUploadProgress(0);
    setManifestUrl('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('email', email);
    formData.append('video_file', file);

    try {
      const response = await axios.post('/api/video/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      const { id } = response.data;
      setProcessingId(id);
      setUploading(false);
      fetchVideos();
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      alert('Upload failed. Please check the backend connection.');
    }
  };

  useEffect(() => {
    let interval;
    if (processingId) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/video/videos/${processingId}/`);
          if (response.data.processed) {
            setManifestUrl(`/media/${response.data.hls_manifest}`);
            setProcessingId(null);
            fetchVideos();
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
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current.play().catch(e => console.log("Auto-play blocked"));
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = manifestUrl;
      }
    }
  }, [manifestUrl]);

  const playVideo = (hls_manifest) => {
    setManifestUrl(`/media/${hls_manifest}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">
            🛡️ SecureStream HLS
          </Navbar.Brand>
        </Container>
      </Navbar>

      <Container>
        <Row>
          {/* Main Content: Player & Upload */}
          <Col lg={8}>
            {manifestUrl ? (
              <Card className="shadow-sm mb-4 border-0 overflow-hidden">
                <Card.Header className="bg-primary text-white py-3">
                  <h5 className="mb-0">Now Playing</h5>
                </Card.Header>
                <div className="ratio ratio-16x9 bg-black">
                  <video ref={videoRef} controls className="w-100" />
                </div>
              </Card>
            ) : (
              <Card className="shadow-sm mb-4 border-0 text-center py-5 bg-white">
                <Card.Body>
                  <div className="mb-3 display-1 text-muted">📽️</div>
                  <h3 className="text-secondary">Select a video to start streaming</h3>
                  <p className="text-muted">Uploaded videos with dynamic watermarks will appear here.</p>
                </Card.Body>
              </Card>
            )}

            <Card className="shadow-sm border-0 mb-4">
              <Card.Body className="p-4">
                <h4 className="mb-4">Upload New Video</h4>
                <Form onSubmit={handleUpload}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Video Title</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="Enter title" 
                          value={title} 
                          onChange={e => setTitle(e.target.value)} 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Watermark Email</Form.Label>
                        <Form.Control 
                          type="email" 
                          placeholder="user@example.com" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          required 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Choose Video File</Form.Label>
                    <Form.Control 
                      type="file" 
                      onChange={handleFileChange} 
                      accept="video/*" 
                      required 
                    />
                    <Form.Text className="text-muted">
                      Your video will be transcoded into multiple qualities with a moving watermark.
                    </Form.Text>
                  </Form.Group>

                  {uploading && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Uploading...</small>
                        <small>{uploadProgress}%</small>
                      </div>
                      <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} variant="success" animated />
                    </div>
                  )}

                  {processingId && (
                    <div className="alert alert-info py-2 px-3 d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-3" role="status" />
                      <span>Transcoding and watermarking in progress...</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="w-100 py-2"
                    disabled={uploading || processingId}
                  >
                    {uploading ? 'Uploading...' : processingId ? 'Processing...' : '🚀 Start Pipeline'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar: Library */}
          <Col lg={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3">
                <h5 className="mb-0">Video Library</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {videos.map(video => (
                    <ListGroup.Item key={video.id} className="p-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0 text-truncate" style={{ maxWidth: '180px' }}>{video.title}</h6>
                        {video.processed ? (
                          <Badge bg="success" pill>Ready</Badge>
                        ) : (
                          <Badge bg="warning" text="dark" pill>Processing</Badge>
                        )}
                      </div>
                      <p className="small text-muted mb-3">
                        {video.email} • {new Date(video.uploaded_at).toLocaleDateString()}
                      </p>
                      {video.processed && (
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="w-100"
                          onClick={() => playVideo(video.hls_manifest)}
                        >
                          ▶ Play Stream
                        </Button>
                      )}
                    </ListGroup.Item>
                  ))}
                  {videos.length === 0 && (
                    <div className="p-5 text-center text-muted">
                      <p>No videos found</p>
                    </div>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <footer className="text-center py-4 mt-5 text-muted border-top bg-white">
        <small>© 2026 SecureStream Pipeline • Powered by Django & FFmpeg</small>
      </footer>
    </div>
  );
};

export default VideoUploader;
