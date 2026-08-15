import { useEffect, useState } from "react";
import { getSystemUsername } from "../lib/systemUsername";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatWatermarkTimestamp(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function PreReleaseWatermark() {
  const [username, setUsername] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    void getSystemUsername().then((value) => {
      if (!cancelled) {
        setUsername(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden="true" className="pre-release-watermark">
      <div className="pre-release-watermark-title">PRE-RELEASE BUILD</div>
      <div className="pre-release-watermark-meta">
        {username === null
          ? "…"
          : `${username} @ ${formatWatermarkTimestamp(now)}`}
      </div>
    </div>
  );
}
