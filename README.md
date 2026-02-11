# Secure HLS Video Streaming Middleware

An advanced, production-ready video processing pipeline built with **Django** and **React**, powered by **FFmpeg**. This system transcodes videos into multi-bitrate HLS streams while injecting dynamic, moving watermarks to ensure content security and traceability.

---

## 🛠 Current Process of Work

The system operates as a high-performance asynchronous pipeline:

1.  **Request & Ingestion**: 
    - Users upload a video through a polished React dashboard or a REST API.
    - Input parameters include the video file, a title, and an email address for watermarking.
2.  **Asynchronous Task Hand-off**: 
    - The API saves the metadata and immediately returns a success response.
    - Processing is offloaded to a background thread (or middleware pipeline) to keep the application responsive.
3.  **Advanced FFmpeg Transcoding**:
    - **Multi-Bitrate Ladder**: The video is transcoded into multiple resolutions (480p, 720p) for Adaptive Bitrate (ABR) streaming.
    - **Dynamic Watermarking**: A custom FFmpeg expression is used to overlay the user's email. The watermark moves smoothly across the screen to prevent easy removal or cropping.
    - **Low-Latency Optimization**: Segments are cut into 2-second chunks with `zerolatency` tuning to minimize the delay before playback starts.
4.  **HLS Packaging**:
    - Generates a Master Playlist (`.m3u8`) that links all resolution variants.
    - Produces HLS segments (`.ts`) stored in a persistent volume.
5.  **Polling & Adaptive Playback**:
    - The frontend dashboard polls the backend for the processing status.
    - Once ready, the stream is delivered via `Hls.js`, automatically adjusting quality based on the user's real-time bandwidth.

---

## 🚀 What Can Be Done (Future Roadmap)

This project is built as a flexible middleware, allowing for several advanced configurations:

### 1. S3 Cloud Middleware Integration
Transform this project into a serverless-style processing node. Instead of local uploads, it can pull source videos directly from **Amazon S3** using pre-signed URLs and stream processed frames back to users in real-time.

### 2. Distributed Task Management
For enterprise-scale workloads, the current threading model can be replaced with **Celery & Redis**. This allows for horizontal scaling of worker nodes to process hundreds of videos simultaneously.

### 3. GPU-Accelerated Transcoding
By updating the FFmpeg configuration in `services.py`, the system can leverage hardware acceleration (e.g., **NVIDIA NVENC** or **Intel QuickSync**) to increase transcoding speeds by up to 10x.

### 4. Advanced Stream Security
- **Signed URLs**: Protect the `.m3u8` manifest so only authorized users can access the stream.
- **DRM Integration**: Add encryption (like AES-128) to the HLS segments for professional-grade content protection.

### 5. Automated Thumbnail & Preview Generation
The pipeline can be extended to automatically extract high-quality thumbnails and 5-second GIF previews during the transcoding process.

---

## 📂 Documentation Links

- [System Overview](DOCS/OVERVIEW.md): High-level architecture.
- [S3 Middleware Guide](DOCS/S3_MIDDLEWARE_GUIDE.md): Integration guide for cloud-based pipelines.
- [Technical Documentation](DOCS/TECHNICAL.md): FFmpeg commands and ABR logic.
- [User & Developer Guide](DOCS/GUIDE.md): Setup and maintenance instructions.

---

## 🚀 Quick Start (Containerized)

```bash
# Run with Docker Compose
docker-compose up --build

# Run with Minikube
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
minikube service video-frontend-service
```
