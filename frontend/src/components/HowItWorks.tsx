const steps = [
  { title: "Report", text: "A barangay official submits an outage or contamination report." },
  { title: "Derive", text: "WellPoint derives alerts and the coverage map from live signals." },
  { title: "Prioritize", text: "The LGU sees at-risk barangays and responds to the most vulnerable first." },
  { title: "Recover", text: "Status and deliveries are tracked until service is restored." },
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
