from django.db import models

class Video(models.Model):
    title = models.CharField(max_length=255)
    email = models.EmailField()  # User’s email for watermark
    video_file = models.FileField(upload_to='uploads/')
    processed = models.BooleanField(default=False)
    # You may store the path to the processed HLS manifest
    hls_manifest = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
