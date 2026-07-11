export default function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }}>
      {label && <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>}
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 100,
          background: checked ? "var(--gradient-brand)" : "var(--surface2)",
          border: "1px solid var(--border2)",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </span>
    </label>
  );
}
