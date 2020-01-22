# Media Recorder API Demo
A demo implementation of the (new) [Media Recorder API](http://w3c.github.io/mediacapture-record/MediaRecorder.html) (also known as MediaStream Recording API).

Works on:
* Firefox 30+
* Chrome 47,48 (video only, enable experimental Web Platform features at chrome://flags)
* Chrome 49+

Containers & codecs:
* Chrome 52+ : webm, VP8/VP9/H.264, Opus @ 48kHz
* Chrome 49+ : webm, VP8/VP9, Opus @ 48kHz
* Firefox 30+: webm,VP8, Vorbis @ 44.1 kHz

Issues:
* Pause does not stop audio recording on Chrome 49,50


Links:
* [Live demo of this code](https://addpipe.com/media-recorder-api-demo/)

* [Article: HTML5’s Media Recorder API in Action on Chrome and Firefox](https://blog.addpipe.com/mediarecorder-api/)

* [W3C Draft (Latest published version)](https://www.w3.org/TR/mediastream-recording/)

* [Media Recorder API at 65% penetration thanks to Chrome](https://addpipe.com/media-recorder-api-demo/)
