import { useEffect, useState } from "react";

const TAGLINES = [
  "Automate. Organize. Succeed.",
  "Your Intelligent Workplace Productivity Assistant",
];

export function RotatingTagline({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      const t = setTimeout(() => {
        setI((v) => (v + 1) % TAGLINES.length);
        setVisible(true);
      }, 400);
      return () => clearTimeout(t);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <p
      className={`transition-opacity duration-500 ease-in-out ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      aria-live="polite"
    >
      {TAGLINES[i]}
    </p>
  );
}
