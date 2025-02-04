import os
import subprocess
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Video
from .serializers import VideoSerializer

class VideoUploadView(APIView):
    def post(self, request, format=None):
        serializer = VideoSerializer(data=request.data)
        if serializer.is_valid():
            video_instance = serializer.save()
            # Start processing after saving
            process_video(video_instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def process_video(video_instance):
    import os
    import subprocess
    from django.conf import settings

    # Build paths
    input_path = video_instance.video_file.path
    output_dir = os.path.join(settings.MEDIA_ROOT, f'processed/video_{video_instance.id}')
    os.makedirs(output_dir, exist_ok=True)
    output_manifest = os.path.join(output_dir, 'output.m3u8')

    # Define the watermark text using the user’s email
    watermark_text = video_instance.email

    # Properly escape the font path for Windows (USE DOUBLE BACKSLASHES OR FORWARD SLASHES)
    font_path = r"C\\:/Windows/Fonts/arial.ttf"  # FFmpeg works well with forward slashes

    # Corrected drawtext filter format (escaping single quotes inside text)
    drawtext_filter = f"drawtext=fontfile={font_path}:text={watermark_text}:fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=10:y=10"

    # Build the FFmpeg command
    ffmpeg_command = [
        'ffmpeg',
        '-i', input_path,
        '-vf', drawtext_filter,
        '-c:a', 'copy',
        '-hls_time', '5',
        '-hls_segment_filename', os.path.join(output_dir, 'segment_%03d.ts'),
        '-hls_playlist_type', 'vod',
        output_manifest
    ]

    try:
        subprocess.run(ffmpeg_command, check=True, shell=True)  # Use shell=True for Windows compatibility
        video_instance.processed = True
        video_instance.hls_manifest = os.path.relpath(output_manifest, settings.MEDIA_ROOT)
        video_instance.save()
    except subprocess.CalledProcessError as e:
        print(f"❌ Error processing video: {e}")
  
    