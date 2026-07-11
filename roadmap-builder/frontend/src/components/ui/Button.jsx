export default function Button({
  children,
  variant = "primary",
  block = false,
  icon,
  className = "",
  ...rest
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
