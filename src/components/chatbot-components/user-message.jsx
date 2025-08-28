import { useEffect, useState } from "react";

export default function UserMessage({ message, delay = 0}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return <p className="user-message">{message}</p>;
}