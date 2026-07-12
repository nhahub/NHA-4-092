import { useEffect, useRef, useState } from "react";
import "./TypingText.css";

/**
 * Cycles through a list of phrases, typing and deleting each one.
 * Usage: <TypingText texts={["Learn Web Development", "Data Science career path"]} />
 */
export default function TypingText({
  texts = [],
  typingSpeed = 55,
  deletingSpeed = 28,
  pause = 1500,
  className = "",
}) {
  const [display, setDisplay] = useState("");
  const indexRef = useRef(0);
  const charRef = useRef(0);
  const phaseRef = useRef("typing"); // typing | pausing | deleting

  useEffect(() => {
    if (!texts.length) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      // Just cycle full phrases without the character-by-character effect.
      setDisplay(texts[0]);
      let i = 0;
      const id = setInterval(() => {
        i = (i + 1) % texts.length;
        setDisplay(texts[i]);
      }, pause + 1200);
      return () => clearInterval(id);
    }

    let timeoutId;

    const tick = () => {
      const current = texts[indexRef.current];

      if (phaseRef.current === "typing") {
        charRef.current += 1;
        setDisplay(current.slice(0, charRef.current));

        if (charRef.current >= current.length) {
          phaseRef.current = "pausing";
          timeoutId = setTimeout(tick, pause);
          return;
        }
        timeoutId = setTimeout(tick, typingSpeed);
        return;
      }

      if (phaseRef.current === "pausing") {
        phaseRef.current = "deleting";
        timeoutId = setTimeout(tick, deletingSpeed);
        return;
      }

      // deleting
      charRef.current -= 1;
      setDisplay(current.slice(0, charRef.current));

      if (charRef.current <= 0) {
        indexRef.current = (indexRef.current + 1) % texts.length;
        phaseRef.current = "typing";
        timeoutId = setTimeout(tick, typingSpeed);
        return;
      }
      timeoutId = setTimeout(tick, deletingSpeed);
    };

    timeoutId = setTimeout(tick, typingSpeed);
    return () => clearTimeout(timeoutId);
  }, [texts, typingSpeed, deletingSpeed, pause]);

  return (
    <span className={`rhodes-typing ${className}`}>
      {display}
      <span className="rhodes-typing-caret">|</span>
    </span>
  );
}
