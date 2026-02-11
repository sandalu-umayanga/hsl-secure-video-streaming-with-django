import os
import subprocess
import time
from django.conf import settings

def create_hls_pipeline(video_instance):
    """
    Advanced Pipeline: 
    1. Dynamic Watermarking
    2. Multi-bitrate transcoding (480p, 720p)
    3. Low-latency HLS optimizations
    """
    start_time = time.time()
    input_path = video_instance.video_file.path
    output_base_dir = os.path.join(settings.MEDIA_ROOT, f'processed/video_{video_instance.id}')
    os.makedirs(output_base_dir, exist_ok=True)

    # Watermark configuration
    # Escaping for FFmpeg drawtext: ' needs to be '\'' and : needs to be \:
    watermark_text = video_instance.email.replace("'", "'\\\\\\''").replace(":", "\\:")
    
    # Define bitrates and resolutions
    # Format: (name, scale, bitrate)
    variants = [
        ("480p", "854:480", "1400k"),
        ("720p", "1280:720", "2800k"),
    ]

    master_playlist_content = ["#EXTM3U", "#EXT-X-VERSION:3"]

    try:
        for name, scale, bitrate in variants:
            variant_dir = os.path.join(output_base_dir, name)
            os.makedirs(variant_dir, exist_ok=True)
            
            variant_manifest = os.path.join(variant_dir, "playlist.m3u8")
            
            # FFmpeg Command for this variant
            # x='(w-tw)*abs(sin(t/5))':y='(h-th)*abs(sin(t/10))' makes the watermark move smoothly
            ffmpeg_command = [
                'ffmpeg', '-i', input_path,
                '-vf', f"scale={scale},drawtext=font='Arial':text='{watermark_text}':fontcolor=white:fontsize=20:box=1:boxcolor=black@0.4:x=(w-tw)*abs(sin(t/5)):y=(h-th)*abs(sin(t/10))",
                '-c:v', 'libx264', '-profile:v', 'main', '-crf', '20', '-sc_threshold', '0', '-g', '48', '-keyint_min', '48',
                '-b:v', bitrate, '-maxrate', bitrate, '-bufsize', bitrate,
                '-c:a', 'aac', '-b:a', '128k',
                '-hls_time', '2', 
                '-hls_playlist_type', 'vod',
                '-hls_segment_filename', os.path.join(variant_dir, 'segment_%03d.ts'),
                '-y', variant_manifest
            ]
            
            print(f"--- Processing Variant: {name} ---")
            subprocess.run(ffmpeg_command, check=True)
            
            # Add to Master Playlist
            bandwidth = int(bitrate.replace('k', '000')) + 128000
            res = scale.replace(':', 'x')
            master_playlist_content.append(f'#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={res}')
            master_playlist_content.append(f'{name}/playlist.m3u8')

        # Write Master Playlist
        master_path = os.path.join(output_base_dir, "master.m3u8")
        with open(master_path, "w") as f:
            f.write("\n".join(master_playlist_content))

        # Update Database
        video_instance.processed = True
        video_instance.hls_manifest = os.path.relpath(master_path, settings.MEDIA_ROOT)
        video_instance.save()
        
        print(f"✅ Pipeline complete for Video {video_instance.id} in {time.time() - start_time:.2f}s")

    except Exception as e:
        print(f"❌ Pipeline failed: {str(e)}")
        raise e