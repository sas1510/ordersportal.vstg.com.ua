import io
import os
import shutil
import subprocess
import tempfile


VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}


class PreparedUpload(io.BytesIO):
    def __init__(self, data, name, content_type):
        super().__init__(data)
        self.name = name
        self.content_type = content_type
        self.size = len(data)


def is_video_upload(file_obj):
    if not file_obj:
        return False

    content_type = getattr(file_obj, "content_type", "") or ""
    file_name = getattr(file_obj, "name", "") or ""
    extension = os.path.splitext(file_name)[1].lower()

    return content_type.startswith("video/") or extension in VIDEO_EXTENSIONS


def maybe_prepare_video_upload(file_obj):
    if not is_video_upload(file_obj):
        return file_obj, False, "not_video"

    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        file_obj.seek(0)
        return file_obj, False, "ffmpeg_not_available"

    original_name = getattr(file_obj, "name", "video.mp4") or "video.mp4"
    original_extension = os.path.splitext(original_name)[1] or ".mp4"
    original_content_type = getattr(file_obj, "content_type", None) or "video/mp4"

    file_obj.seek(0)
    original_bytes = file_obj.read()
    file_obj.seek(0)

    if not original_bytes:
        return file_obj, False, "empty_file"

    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, f"source{original_extension}")
        output_path = os.path.join(temp_dir, "compressed.mp4")

        with open(input_path, "wb") as temp_input:
            temp_input.write(original_bytes)

        command = [
            ffmpeg_path,
            "-y",
            "-i",
            input_path,
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-vf",
            "scale=min(1280\\,iw):-2",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "30",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-movflags",
            "+faststart",
            output_path,
        ]

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )

        if result.returncode != 0 or not os.path.exists(output_path):
            return file_obj, False, "compression_failed"

        with open(output_path, "rb") as temp_output:
            compressed_bytes = temp_output.read()

    if not compressed_bytes or len(compressed_bytes) >= len(original_bytes):
        return file_obj, False, "not_smaller"

    compressed_name = f"{os.path.splitext(original_name)[0]}.mp4"
    prepared_file = PreparedUpload(
        data=compressed_bytes,
        name=compressed_name,
        content_type="video/mp4",
    )
    prepared_file.seek(0)

    return prepared_file, True, {
        "original_size": len(original_bytes),
        "compressed_size": len(compressed_bytes),
        "original_content_type": original_content_type,
    }
