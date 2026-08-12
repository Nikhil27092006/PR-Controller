@echo off
set FFMPEG=C:\Users\bpnsi\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe
set INPUT=E:\3d webste\3d.mp4
set OUTDIR=E:\3d webste\public\frames

echo Clearing old frames...
del /q "%OUTDIR%\frame_*.jpg" 2>nul

echo.
echo Extracting 160 frames at MAXIMUM quality (1920x1080, q:v 1)...
echo Video is 10s at 24fps = 240 frames total
echo Extracting all 240 frames (full 24fps) = ultra smooth scrubbing
echo.

REM Extract ALL original frames at 24fps — 240 total at 1920x1080 max quality
REM q:v 1 = absolutely maximum JPEG quality
REM scale=1920:-2 with lanczos = best upscale from 1280x720
"%FFMPEG%" -i "%INPUT%" -vf "scale=1920:-2:flags=lanczos" -q:v 1 -fps_mode passthrough "%OUTDIR%\frame_%%04d.jpg" -y 2>&1

echo.
echo Done! Counting frames...
set /a count=0
for %%f in ("%OUTDIR%\frame_*.jpg") do set /a count+=1
echo Total frames extracted: %count%
