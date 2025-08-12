# Media Recorder API Demo
A demo implementation of the (new) [Media Recorder API](http://w3c.github.io/mediacapture-record/MediaRecorder.html) (also known as MediaStream Recording API).

Works on:
* Firefox 30+
* Chrome 47,48 (video only, enable experimental Web Platform features at chrome://flags)
* Chrome 49+
* Safari on macOS 14.0.2+
* Safari on iOS 14.3+

Containers & codecs:
* Safari on iOS 14.3+ : mp4, H264, Stereo AAC @ 44.1kHz or 48kHz
* Safari on macOS 18.4+ : mp4/webm, H264/HEVC/AV1, Stereo AAC @ 48kHz
* Safari on macOS 14.0.2+ : mp4, H264, Stereo AAC @ 48kHz
* Chrome 136+ : webm/mp4, VP8/VP9/H264/AV1/HEVC, Opus @ 48kHz
* Chrome 126+ : webm/mp4, VP8/VP9/H264/AV1, Opus @ 48kHz
* Chrome 52+ : webm, VP8/VP9/H.264, Opus @ 48kHz
* Chrome 49+ : webm, VP8/VP9, Opus @ 48kHz
* Firefox 30+: webm,VP8, Vorbis/Opus @ 44.1 kHz

Issues:
* Pause does not stop audio recording on Chrome 49,50


Links:
* [Live demo of this code](https://addpipe.com/media-recorder-api-demo/)

* [Article: HTML5’s Media Recorder API in Action on Chrome and Firefox](https://blog.addpipe.com/mediarecorder-api/)

* [W3C Draft (Latest published version)](https://www.w3.org/TR/mediastream-recording/)

* [Media Recorder API at 65% penetration thanks to Chrome](https://addpipe.com/media-recorder-api-demo/)
