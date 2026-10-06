import type { ReactNode } from "react";

type Feature = { title: string; text: string; bg: string; color: string; icon: ReactNode };

const features: Feature[] = [
  { title: "Track Water Sources", text: "Watch the status of Catbalogan's three water sources in one place.", bg: "#e4efff", color: "#1565c8", icon: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /> },
  { title: "Barangay Map", text: "See which barangays have water and which are running dry.", bg: "#e1f6ea", color: "#1aa86b", icon: (<><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>) },
  { title: "Priority Tankers", text: "Tankers go first to the barangays that need them most.", bg: "#e4efff", color: "#1565c8", icon: (<><path d="M3 17V6h11v11M14 10h4l3 3v4h-3M3 17h2m6 0h3" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>) },
  { title: "Report Problems", text: "Tell us when and where the water stops, with details and location.", bg: "#f0e8fb", color: "#7c4dcf", icon: <path d="M4 5h16v11H9l-5 4z" /> },
  { title: "Get Updates", text: "Receive alerts on interruptions, shortages and announcements.", bg: "#fdf1d4", color: "#e29a0b", icon: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" /> },
];

export function Features() {
  return (
    <section className="sec" id="features">
      <div className="feat">
        {features.map((f) => (
          <div key={f.title}>
            <div className="ic" style={{ background: f.bg, color: f.color }}>
              <svg viewBox="0 0 24 24">{f.icon}</svg>
            </div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
