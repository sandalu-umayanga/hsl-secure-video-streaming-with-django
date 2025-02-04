from rest_framework import serializers
from .models import Video

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'title', 'email', 'video_file', 'processed', 'hls_manifest', 'uploaded_at']
        read_only_fields = ['processed', 'hls_manifest', 'uploaded_at']
