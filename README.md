# Django HLS Video Streaming with Watermark

## Overview

This project is a Django-based video streaming platform that processes uploaded videos into HLS format and embeds a watermark. It ensures smooth streaming and allows efficient video playback with reduced latency.

   

## Features

Upload videos and process them into HLS format

Automatically add a watermark with the uploader's email

Serve segmented video files for adaptive streaming

Optimize latency for better streaming performance

## Usage

Upload a video through the provided API.

The system will process and generate HLS segments.

Access the processed video via the provided HLS manifest (.m3u8).

Example video:- https://drive.google.com/file/d/1cVnQPmTlRJqjHNuU94g8aXbkxnS85Aj9/view?usp=sharing

*for video with a length of 12.28s processing time is 3.79s (this will be changed with the resources)*
