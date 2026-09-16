# Animated menu cover

Source: the existing public assets/menu-keyart.png, imported directly from the
live GitHub Pages game. No replacement cover or new composition was requested.

Higgsfield Seedance 2.5 job: 5a7babab-0c6b-4f53-a015-b3c100e9a9c3.
Approved price: 54 credits. Generated 6-second 1920x1080 silent video with the
same reference used for start and end frames. Prompt requested a locked camera,
preserved lettering, still characters and tiny ambient smoke/foliage/light motion.

Final file: public/assets/menu-cover-loop.mp4.
Processed in Higgsfield's sandbox: one-second cyclic overlap, 24 fps, H.264,
yuv420p, CRF 20, faststart, no audio. Final duration 5 seconds; 1,229,900 bytes.
The overlap reduces the boundary difference; this is a compressed cinemagraph,
not a claim that every first/last decoded pixel is identical.

Playback only runs on the landscape main menu. Options/submenus, gameplay,
hidden tabs, OS Reduced Motion and the in-game Reduced Motion preference pause
playback. Portrait layouts retain their separately composed static cover.
Failure or blocked autoplay retains the original CSS image. Reduced-motion and
portrait initial loads do not request the video.

Verification:
- npm test (99 tests)
- npm run build
- scripts/menu-cover-browser.js: actual decoded frame motion, loop boundary,
  1080p dimensions, muted loop, navigation, both reduced-motion mechanisms,
  portrait fallback, error fallback, no JavaScript errors.
