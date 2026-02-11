# Technical Documentation

## Technologies Used

### Backend
- **Django 5.1+**: Core web framework.
- **Django REST Framework**: For building the video management API.
- **SQLite**: Local database for storing video metadata and processing status.
- **FFmpeg**: The "engine" of the pipeline, used for transcoding and watermarking.

### Frontend
- **React 18+**: For the user interface.
- **Axios**: For API communication and file upload progress.
- **Hls.js**: A JavaScript library that implements an HLS client, allowing playback in browsers without native support.

---

## Technical Techniques

### 1. Dynamic Moving Watermark
Instead of a static overlay, we use FFmpeg expressions to calculate the watermark position per frame:
- **X-Coordinate**: `(w-tw)*abs(sin(t/5))`
- **Y-Coordinate**: `(h-th)*abs(sin(t/10))`
*Where `w`/`h` are video dimensions, `tw`/`th` are text dimensions, and `t` is timestamp.*

### 2. Low-Latency HLS (LL-HLS)
To minimize the delay between the server and the viewer:
- **Segment Duration**: Set to 2 seconds (`-hls_time 2`).
- **Zero Latency Tuning**: Used `-tune zerolatency` to reduce encoder buffering.
- **Fixed GOP**: Keyframes are forced every 2 seconds (`-g 48`) to match segment boundaries perfectly.

### 3. Multi-Bitrate (Adaptive Bitrate)
The pipeline creates a "Stream Ladder":
- **480p**: 1400k bitrate for mobile/weak networks.
- **720p**: 2800k bitrate for high-speed connections.
A **Master Playlist** directs the player to the appropriate variant based on real-time bandwidth.

### 4. Asynchronous Threading
Processing is offloaded to `threading.Thread` in Python. This ensures that the HTTP request-response cycle is not blocked by heavy video transcoding tasks.
