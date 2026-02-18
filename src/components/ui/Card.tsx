import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
