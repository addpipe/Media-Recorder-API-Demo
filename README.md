# Media Recorder API Demo
A demo implementation of the (new) [MediaStream Recording API](http://w3c.github.io/mediacapture-record/MediaRecorder.html).

Works on:
* Firefox 30+
* Chrome 47,48 (video only, enable experimental Web Platform features at chrome://flags)
* Chrome 49+
* Safari on macOS 14.0.2+
* Safari on iOS 14.3+

Containers & codecs:

| Browser | Version | Container | Video Codecs | Audio Codecs |
|---|---|---|---|---|
| Chrome | 47+ | WebM | VP8 | — |
| Chrome | 49+ | WebM | VP8, VP9 | Opus @ 48kHz |
| Chrome | 52+ | WebM | VP8, VP9, H.264 | Opus @ 48kHz |
| Chrome | 64+ | WebM | VP8, VP9, H.264 | Opus, PCM @ 48kHz |
| Chrome | 126+ | WebM, MP4\* | VP8, VP9, H.264, AV1¹ | Opus, PCM @ 48kHz; AAC LC (MP4 only) |
| Chrome | 136+ | WebM, MP4\* | VP8, VP9, H.264, AV1¹, HEVC² | Opus, PCM @ 48kHz; AAC LC (MP4 only) |
| Firefox | 30+ | WebM | VP8 | Vorbis/Opus @ 44.1kHz |
| Safari macOS | 14.0.2+ | MP4\* | H.264 | AAC @ 48kHz |
| Safari macOS | 18.4+ | MP4\*, WebM | H.264, VP8, VP9, HEVC, AV1³ | AAC, Opus @ 48kHz |
| Safari iOS | 14.3+ | MP4\* | H.264 | AAC @ 44.1/48kHz |
| Safari iOS | 18.4+ | MP4\*, WebM | H.264, VP8, VP9, HEVC, AV1³ | AAC, Opus @ 44.1/48kHz |

\* Produces a fragmented MP4 (fMP4).  
¹ Chrome on macOS always uses software AV1 encoding.  
² HEVC encoding is only supported if the user's device and OS provide the necessary capabilities.  
³ AV1 video tracks are supported on devices with AV1 hardware support.

Issues:
* Pause does not stop audio recording on Chrome 49,50


Links:
* [Live demo of this code](https://addpipe.com/tech-demos/media-recorder-api-demo/)

* [Article: HTML5’s Media Recorder API in Action on Chrome and Firefox](https://blog.addpipe.com/mediarecorder-api/)

* [W3C Draft (Latest published version)](https://www.w3.org/TR/mediastream-recording/)

* [Media Recorder API at 65% penetration thanks to Chrome](https://blog.addpipe.com/media-recorder-api-is-now-supported-by-65-of-all-desktop-internet-users/)
