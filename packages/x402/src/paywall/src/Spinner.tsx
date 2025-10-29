/**
 * Simple Spinner component for loading states
 * Uses currentColor to inherit the parent's text color
 *
 * @param props - The component props
 * @param props.className - Optional CSS classes to apply to the spinner
 * @returns The Spinner component
 */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        className="rounded-full"
        style={{
          width: "16px",
          height: "16px",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          borderTopColor: "currentColor",
          animation: "spin 0.6s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
