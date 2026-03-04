import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "hero";
  style?: React.CSSProperties;
}

export default function Card({
  children,
  className,
  variant = "default",
  style,
}: CardProps) {
  return (
    <div
      className={clsx(
        "transition-shadow duration-200",
        variant === "hero"
          ? "rounded-[var(--radius-card-lg)] p-8"
          : "brand-card p-6",
        variant === "default" && "brand-card-hover",
        className
      )}
      style={{
        ...(variant === "hero"
          ? {
              background:
                "linear-gradient(135deg, #062A74 0%, #034BE4 100%)",
              color: "#fff",
              boxShadow: "var(--shadow-card-hover)",
            }
          : variant === "elevated"
            ? { boxShadow: "var(--shadow-card-hover)" }
            : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
