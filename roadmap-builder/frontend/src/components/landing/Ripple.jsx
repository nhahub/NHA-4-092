import "./Ripple.css";

/**
 * Ambient ripple background — concentric rings pulsing outward from center.
 * Purely decorative, sits behind content (parent must be position:relative).
 */
export default function Ripple({ rings = 5, className = "" }) {
  return (
    <div className={`rhodes-ripple ${className}`} aria-hidden="true">
      {Array.from({ length: rings }).map((_, i) => (
        <span
          key={i}
          className="rhodes-ripple-ring"
          style={{
            width: `${220 + i * 150}px`,
            height: `${220 + i * 150}px`,
            animationDelay: `${i * 1.1}s`,
          }}
        />
      ))}
    </div>
  );
}
