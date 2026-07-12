import { useEffect, useRef, useState } from "react";
import "./ContainerTextFlip.css";

/**
 * Pill-shaped container that flips between a list of words.
 * Usage: <ContainerTextFlip words={["Web Developer", "Data Analyst", "UX Designer"]} />
 */
export default function ContainerTextFlip({
  words = [],
  interval = 2400,
  className = "",
}) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(null);
  const measureRef = useRef(null);

  // Size the pill to the widest word so it doesn't jump around as words change.
    useEffect(() => {
        if (!measureRef.current) return;
        const spans = measureRef.current.querySelectorAll("[data-measure]");
        let max = 0;
        spans.forEach((el) => {
            max = Math.max(max, el.offsetWidth);
        });

        // Account for the container's own padding + border (box-sizing: border-box
        // means the width we set has to include these, or long words get clipped)
        const containerEl = measureRef.current.closest(".rhodes-flip-container");
        let extra = 40; // fallback if the container isn't found for some reason

        if (containerEl) {
            const cs = window.getComputedStyle(containerEl);
            extra =
                parseFloat(cs.paddingLeft || 0) +
                parseFloat(cs.paddingRight || 0) +
                parseFloat(cs.borderLeftWidth || 0) +
                parseFloat(cs.borderRightWidth || 0) +
                4; // small buffer for sub-pixel rounding
        }

        setWidth(max + extra);
    }, [words]);

  useEffect(() => {
    if (words.length <= 1) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const tick = reduceMotion ? interval * 1.5 : interval;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, tick);

    return () => clearInterval(id);
  }, [words, interval]);

  if (!words.length) return null;

  return (
    <span
      className={`rhodes-flip-container ${className}`}
      style={width ? { width } : undefined}
    >
      <span key={index} className="rhodes-flip-word">
        {words[index]}
      </span>

      {/* Hidden measuring copies to compute a stable pill width */}
      <span ref={measureRef} className="rhodes-flip-measure" aria-hidden="true">
        {words.map((w, i) => (
          <span data-measure key={i}>
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}
