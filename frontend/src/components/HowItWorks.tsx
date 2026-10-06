const steps = [
  { title: "Report", text: "Submit a water issue with details and location." },
  { title: "Verify", text: "Our team reviews and validates the report." },
  { title: "Take Action", text: "The issue is marked on the map and tankers are sent." },
  { title: "Stay Informed", text: "Residents receive updates and delivery schedules." },
];

export function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="sec">
        <div>
          <div className="eyebrow">Simple steps. Big impact.</div>
          <h2>How It Works</h2>
          <p className="sub">Together, we can build a more resilient and water-secure community.</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={s.title}>
              <span className="n">{i + 1}</span>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
