import os
import subprocess
import threading
import time
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Video
from .serializers import VideoSerializer
from .services import create_hls_pipeline

from rest_framework import generics

def process_video(video_instance):
    """
    Wrapper for the background thread to call the enhanced pipeline.
    """
    try:
        create_hls_pipeline(video_instance)
    except Exception as e:
        print(f"❌ Background task error for video {video_instance.id}: {e}")

class VideoListView(generics.ListAPIView):
    queryset = Video.objects.all().order_by('-uploaded_at')
    serializer_class = VideoSerializer

class VideoDetailView(generics.RetrieveAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

class VideoUploadView(APIView):
    def post(self, request, format=None):
        serializer = VideoSerializer(data=request.data)
        if serializer.is_valid():
            video_instance = serializer.save()
            # Start processing in a background thread to avoid blocking the request
            threading.Thread(target=process_video, args=(video_instance,)).start()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)