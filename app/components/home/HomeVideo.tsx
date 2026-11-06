"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "../../lib/language";

/**
 * The product video and its poster (public/video). Both are real recordings / stills of the product UI; see docs/PRODUCT_SPEC.md. The page plays
 * a 19-second edit of the original 35-second recording (same frames, pauses trimmed, the plan scroll at 1.75x); the original file is kept
 * unchanged next to it (`plan-demo.mp4`). Both are temporary until the owner's final video.
 */
export const HOME_VIDEO_SRC = "/video/plan-demo-short.mp4";
export const HOME_VIDEO_POSTER = "/video/plan-demo-poster.jpg";

const noopSubscribe = () => () => {};

/**
 * Click-to-play product video: the poster and one play button first (the native controls appear once it has started, and are there from the
 * start without JavaScript), no autoplay, no audio track, nothing downloaded until the visitor presses play
 * (preload="none"; the poster is the only file loaded up front). The box reserves a 4:5 area, so nothing moves when it loads.
 *
 * The large play button is added only after hydration (without JavaScript the native controls and poster remain), it really starts
 * the video, and it disappears once the video has started. If the video file cannot be loaded, the poster stays and an honest line
 * says so -- there is never a play button that does nothing.
 */
export default function HomeVideo() {
  const { t } = useLanguage();
  const copy = t.home.video;
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  async function play() {
    try {
      await videoRef.current?.play();
    } catch {
      // The browser refused to start it (e.g. a data saver): leave the native controls to the visitor.
    }
  }

  return (
    <div className="mx-auto w-full max-w-[22rem] sm:max-w-[22rem]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          width={640}
          height={800}
          controls={!mounted || started}
          playsInline
          preload="none"
          poster={HOME_VIDEO_POSTER}
          aria-label={copy.title}
          onPlay={() => setStarted(true)}
          onError={() => setFailed(true)}
        >
          <source src={HOME_VIDEO_SRC} type="video/mp4" onError={() => setFailed(true)} />
        </video>

        {mounted && !started && !failed && (
          <button
            type="button"
            onClick={play}
            aria-label={copy.play}
            className="absolute start-1/2 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-[background-color,transform] hover:bg-brand-strong active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ltr:-translate-x-1/2 rtl:translate-x-1/2"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-px" aria-hidden="true">
              <path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          </button>
        )}
      </div>
      {failed && <p className="mt-2 text-center text-xs text-muted">{copy.unavailable}</p>}
    </div>
  );
}
