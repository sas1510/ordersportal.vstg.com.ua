import { useEffect, useRef, useState } from "react";

export default function TikTokPlayer({ videoId, title }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="w-full h-full">{visible && <iframe src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=0&description=1&music_info=1`} className="w-full h-full border-0" title={title || "TikTok"} allow="fullscreen; encrypted-media" allowFullScreen />}</div>;
}
