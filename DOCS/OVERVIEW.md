# System Overview

## Deployment Architecture

The system is designed for modern cloud environments and supports multiple deployment strategies:

- **Local Development**: Python/Django and React run natively.
- **Containerized**: Docker Compose manages separate containers. The frontend uses **Nginx** as a reverse proxy to route `/api` and `/media` requests to the backend.
- **Orchestrated (Production)**: Kubernetes manifests provide a scalable, highly available deployment. Internal service discovery (`video-backend-service`) is used for seamless communication between components.

### Data Flow
1.  **Ingestion**: Users upload MP4 videos via the React frontend.
2.  **API Layer**: Django receives the file, saves the metadata to SQLite, and triggers an asynchronous processing job.
3.  **Processing Pipeline (FFmpeg)**: 
    -   The system spawns a background thread.
    -   FFmpeg transcodes the video into multiple bitrates (480p, 720p).
    -   A dynamic, moving watermark is injected into the video stream.
    -   The video is segmented into HLS (.ts) fragments and indexed in a master playlist (.m3u8).
4.  **Delivery**: The frontend polls the API for completion. Once ready, it uses `Hls.js` to fetch the master playlist and stream the video adaptively.

## Key Goals
- **Security**: Hard-to-remove moving watermarks.
- **Performance**: Low-latency HLS for quick playback starts.
- **Accessibility**: Multi-bitrate support for various network conditions.
