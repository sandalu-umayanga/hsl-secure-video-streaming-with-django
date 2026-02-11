# Secure HLS Video Streaming with Django & React

This project is a full-stack application that allows users to upload videos, which are then asynchronously processed to include a dynamic watermark (user's email) and converted into HLS (HTTP Live Streaming) format for secure, adaptive bitrate streaming.

## Features

- **Enhanced Pipeline**: Multi-bitrate transcoding (480p and 720p) for adaptive streaming.
- **Low-Latency Optimizations**: Reduced segment duration (2s) and encoder tuning (`zerolatency`) for faster startup times.
- **Adaptive Bitrate (ABR)**: Automatic switching between quality levels based on bandwidth.
- **Asynchronous Processing**: Videos are processed in the background using Python threads, ensuring the UI remains responsive.
- **Dynamic Watermarking**: FFmpeg overlays the user's email onto the video during processing.
- **HLS Conversion**: Automatically segments videos into `.ts` files and generates an `.m3u8` manifest for smooth streaming.
- **Live Status Polling**: The React frontend polls the API to track processing status in real-time.
- **Docker & Kubernetes Ready**: Complete containerization and orchestration manifests included for production-grade deployment.
- **Video Library**: A dashboard to view and play previously processed videos.

---

## Documentation

For more in-depth information, please refer to the following files in the `DOCS/` directory:

- [System Overview](DOCS/OVERVIEW.md): High-level architecture and data flow.
- [S3 Middleware Guide](DOCS/S3_MIDDLEWARE_GUIDE.md): How to use this project as a video processing service for S3.
- [Technical Documentation](DOCS/TECHNICAL.md): Details on FFmpeg techniques, bitrates, and low-latency HLS.
- [User & Developer Guide](DOCS/GUIDE.md): Instructions on how to use the app and extend its functionality.

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Python 3.8+**
2.  **Node.js & npm**
3.  **FFmpeg**: Must be installed and added to your system's PATH. 
    - *Note: On Windows, ensure `fontconfig` is working or that the 'Arial' font is available for the watermark feature.*

---

## Setup Instructions

### 1. Backend Setup (Django)

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Create a virtual environment** (optional but recommended):
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # Windows
    source venv/bin/activate # Linux/Mac
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run Migrations**:
    ```bash
    python manage.py migrate
    ```

5.  **Start the server**:
    ```bash
    python manage.py runserver
    ```
    The backend will be available at `http://localhost:8000`.

### 2. Frontend Setup (React)

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend/video-frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm start
    ```
    The frontend will open automatically at `http://localhost:3000`.

---

## How it Works

1.  **Upload**: The user provides a title, email, and video file via the React UI.
2.  **API Hand-off**: The Django API saves the record and immediately returns a success response while spawning a background thread for processing.
3.  **FFmpeg Processing**:
    - The background task uses FFmpeg to draw the watermark text on the video.
    - It simultaneously converts the video into HLS segments (`.ts` files).
4.  **Status Polling**: The frontend receives the video ID and polls `GET /api/video/videos/<id>/` until `processed: true` is returned.
5.  **Streaming**: Once ready, the frontend uses `hls.js` to stream the manifest URL from the Django media folder.

---

## Project Structure

- `backend/`: Django project containing the API and video processing logic.
  - `videoapp/`: Main application logic (models, views, serializers).
  - `media/`: Storage for uploaded and processed videos.
- `frontend/video-frontend/`: React application.
  - `src/VideoUploader.js`: Main component for uploading, polling, and playing videos.

## Troubleshooting

- **FFmpeg Errors**: If watermarking fails, ensure FFmpeg is correctly installed and that the 'Arial' font is accessible to the system.
- **CORS Issues**: The backend is configured to allow requests from `http://localhost:3000`. If you change the frontend port, update `CORS_ALLOWED_ORIGINS` in `backend/myproject/settings.py`.