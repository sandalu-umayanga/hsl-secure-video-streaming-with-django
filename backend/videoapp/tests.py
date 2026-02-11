from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Video

class VideoTests(APITestCase):
    def test_upload_video(self):
        """
        Ensure we can upload a new video object.
        """
        url = reverse('video-upload')
        # We use a very small valid-ish header or just accept that background task might fail in test
        # but the API response should still be 201.
        video_content = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom' 
        video_file = SimpleUploadedFile("test_video.mp4", video_content, content_type="video/mp4")
        
        data = {
            'title': 'Test Video',
            'email': 'test@example.com',
            'video_file': video_file
        }
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Video.objects.count(), 1)

    def test_list_videos(self):
        """
        Ensure we can list videos.
        """
        Video.objects.create(title="Existing Video", email="test@example.com", video_file="uploads/test.mp4")
        url = reverse('video-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
