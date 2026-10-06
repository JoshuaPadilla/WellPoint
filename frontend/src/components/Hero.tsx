import { useState } from "react";
import { Link } from "@tanstack/react-router";

/** Place your photo at public/images/catbalogan.jpg — it appears automatically. */
const HERO_IMAGE = "/images/catbalogan.jpg";

const pins = [
  { left: "30%", top: "28%", c: "#e5484d" },
  { left: "62%", top: "18%", c: "#1aa86b" },
  { left: "48%", top: "52%", c: "#f5a524" },
  { left: "72%", top: "66%", c: "#1565c8" },
  { left: "22%", top: "70%", c: "#1aa86b" },
];

export function Hero() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className={`hero${loaded ? " has" : ""}`} id="hero">
      <div className="bg">
        <svg className="scene" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M0 330c120-60 200-20 320-50s200-80 340-40 200-20 330-10 280-30 450 40v290H0z" fill="#9cc2dc" opacity=".6" />
          <path d="M0 380c160-40 260-10 400-30s260-50 420-10 340 20 620-20v240H0z" fill="#7fb0cf" opacity=".7" />
          <rect y="400" width="1440" height="160" fill="#5d9fcb" />
          <path d="M0 410c200-8 300 12 500 4s360-10 520 0 300 6 420-2v30H0z" fill="#79b4d9" opacity=".7" />
        </svg>
        <img src={HERO_IMAGE} alt="Catbalogan City landscape" onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
      </div>

      <div className="wrap">
        <div>
          <div className="eyebrow">Community water solution</div>
          <h1>
            Know when the water stops <span>before it does.</span>
          </h1>
          <p className="lead">
            WellPoint tracks Catbalogan's three water sources and sends tankers to the barangays that need them first
            when pipes fail.
          </p>
          <div className="cta">
            <Link className="btn p" to="/register">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              Create an account
            </Link>
            <a className="btn s" href="#how">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              See how it works
            </a>
          </div>
        </div>

        <div className="devs" aria-hidden="true">
          <div className="lap">
            <div className="scr">
              <div className="side">
                <b>WellPoint</b>
                <div className="on">Dashboard</div>
                <div>Water sources</div>
                <div>Barangays</div>
                <div>Tankers</div>
                <div>Updates</div>
              </div>
              <div className="main">
                <div className="map">
                  {pins.map((p, i) => (
                    <span key={i} className="pin" style={{ left: p.left, top: p.top, background: p.c }} />
                  ))}
                </div>
                <div className="panel">
                  <div className="box">
                    <b>Water supply status</b>
                    <div className="ring" style={{ marginTop: 6 }}>
                      <i />
                      <span><b style={{ color: "#1aa86b", fontSize: 11 }}>Normal</b></span>
                    </div>
                  </div>
                  <div className="box">
                    <b>Recent reports</b>
                    <div className="row"><u style={{ background: "#e5484d" }} />No water supply</div>
                    <div className="row"><u style={{ background: "#f5a524" }} />Low pressure</div>
                    <div className="row"><u style={{ background: "#1565c8" }} />Tanker en route</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="ph">
            <div className="in">
              <b style={{ color: "#0a1f6b", fontSize: 10 }}>WellPoint</b>
              <div className="alert"><b>Water alert</b><br />A barangay is first in line for tanker delivery.</div>
              <div className="tiles"><div>Sources</div><div>Map</div><div>Updates</div><div>Requests</div></div>
            </div>
          </div>
        </div>
      </div>

      <svg className="wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 50c240 40 480 36 720 8s480-30 720 4v18H0z" fill="var(--bg)" />
      </svg>
    </section>
  );
}
