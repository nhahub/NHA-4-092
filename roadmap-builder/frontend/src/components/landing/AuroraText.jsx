import "./AuroraText.css";

/**
 * Animated gradient "aura" text — cycles through the brand gradient.
 * Usage: <AuroraText>road</AuroraText>
 */
export default function AuroraText({ children, as: Tag = "span", className = "" }) {
  return <Tag className={`rhodes-aurora-text ${className}`}>{children}</Tag>;
}
