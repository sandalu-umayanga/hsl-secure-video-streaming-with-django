# User & Developer Guide

## How to Use the Application

### 1. Uploading a Video
1. Open the frontend dashboard (`http://localhost:3000`).
2. Enter a **Title** for the video.
3. Enter your **Email** (this will be used as the moving watermark).
4. Select an **MP4 file** and click "Upload Video".

### 2. Processing Phase
- After upload, the video will appear in the "Your Videos" list with a **Processing...** status.
- The backend is currently transcoding the video into multiple qualities and adding the watermark.
- The UI will automatically refresh once the processing is complete.

### 3. Playback
- Click the **Play** button once the status changes.
- The player will start with the best quality for your connection and allow you to seek through the video segments smoothly.

---

## Maintenance for Developers

### Adding New Resolutions
To add a new quality level (e.g., 1080p), modify the `variants` list in `backend/videoapp/services.py`:
```python
variants = [
    ("480p", "854:480", "1400k"),
    ("720p", "1280:720", "2800k"),
    ("1080p", "1920:1080", "5000k"), # New entry
]
```

### Adjusting Watermark Speed
To change how fast the watermark moves, adjust the divisors in the `sin(t/X)` functions within `services.py`. A smaller number makes it move faster.

### Storage Management
Processed files are stored in `backend/media/processed/`. Periodic cleanup of the `uploads/` folder may be required to save disk space after processing is complete.
