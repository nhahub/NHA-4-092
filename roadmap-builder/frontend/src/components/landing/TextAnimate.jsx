import { useEffect, useRef, useState } from "react";
import "./TextAnimate.css";

/**
 * Reveals text word-by-word with a staggered fade/slide when it scrolls into view.
 * Usage: <TextAnimate as="h2">Why Rhodes</TextAnimate>
 */
export default function TextAnimate({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setInView(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const words = String(children).split(" ");

  return (
    <Tag ref={ref} className={`rhodes-text-animate ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className={`rhodes-ta-word${inView ? " rhodes-ta-in" : ""}`}
          style={{ transitionDelay: `${delay + i * 45}ms` }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
