export default function Badge({ children, level = "beginner" }) {
  const normalized = (level || "beginner").toLowerCase();
  return <span className={`badge badge-${normalized}`}>{children}</span>;
}
