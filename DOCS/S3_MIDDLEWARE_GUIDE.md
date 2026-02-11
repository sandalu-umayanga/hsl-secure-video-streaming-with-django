# Secure Video Middleware: S3 to User Pipeline Guide

This document explains how to utilize the existing architecture of this project as a middleware service. The goal is to receive a request from an external service, fetch a video from Amazon S3, inject dynamic watermarks into every frame, and stream the result to the user.

---

## Architecture Flow

1.  **Request Ingestion**: An external service sends a POST request to the middleware containing the S3 Object Key and the user's identification (for the watermark).
2.  **S3 Authentication**: The middleware uses `boto3` (AWS SDK) to generate a **Pre-signed URL**. This allows FFmpeg to stream the source file securely without downloading the entire video to disk first.
3.  **Frame-by-Frame Processing**: The existing FFmpeg pipeline in `services.py` is invoked. The `drawtext` filter is a per-frame operation, ensuring every single frame is watermarked.
4.  **HLS Segmentation**: The video is transcoded into HLS segments.
5.  **Streaming Delivery**: The user receives the HLS manifest (`.m3u8`) and begins playing the segments as they are generated.

---

## Implementation Steps

### Step 1: Triggering the Pipeline from S3
Instead of a multipart file upload, the `VideoUploadView` can be adapted to accept a JSON payload:
```json
{
    "title": "Movie_01",
    "email": "user@example.com",
    "s3_key": "raw_videos/nature.mp4"
}
```
**Mechanism**: Use `boto3` to generate a temporary URL:
```python
s3_client = boto3.client('s3')
input_url = s3_client.generate_presigned_url('get_object', Params={'Bucket': 'my-bucket', 'Key': s3_key})
```

### Step 2: In-Stream Transcoding (The FFmpeg Engine)
Your existing `create_hls_pipeline` in `services.py` is already designed to handle this. By passing the `input_url` to FFmpeg:
-   **Input**: `ffmpeg -i "https://s3-url..."`
-   **Processing**: The `-vf drawtext` filter applies the watermark to every frame in the decoded stream.
-   **Optimization**: Using `-tune zerolatency` ensures that as soon as the first few frames are processed, the first HLS segment is ready for the user.

### Step 3: Low-Latency Delivery
To achieve the "request-to-stream" behavior:
1.  **Immediate Response**: The middleware returns the URL of the `master.m3u8` immediately after starting the FFmpeg thread.
2.  **Adaptive Streaming**: As FFmpeg creates the `.ts` files, the user's player (Hls.js) fetches them in sequence.
3.  **Nginx Proxying**: The existing Nginx configuration handles the delivery of these segments, ensuring high throughput and low overhead.

---

## Technical Advantages of This Setup

-   **Zero Local Storage (Optional)**: By piping FFmpeg's output directly or using a RAM disk for the `media/` folder, you can avoid permanent storage costs.
-   **Scalability**: In a Kubernetes environment (using the included `k8s/` manifests), you can scale the backend pods horizontally. Each pod acts as an independent processing node for a specific user request.
-   **Dynamic Branding**: Since the watermark is injected via the `email` field in real-time, every user gets a unique, trackable stream, preventing unauthorized screen recordings from being anonymous.

---

## Key Considerations
-   **S3 Bandwidth**: Ensure the S3 bucket is in the same region as your Kubernetes cluster to minimize latency and data transfer costs.
-   **CPU Usage**: Watermarking every frame is CPU intensive. Using the provided Kubernetes resource limits is recommended to prevent pod throttling.
