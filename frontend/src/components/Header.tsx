import { useState } from "react";
import { Link } from "@tanstack/react-router";

const links = [
  { href: "#features", label: "Features" },
  { href: "#sources", label: "Water sources" },
  { href: "#how", label: "How it works" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <div className="nav">
        <Link className="brand" to="/">
          <img src="/logo.svg" width={38} height={40} alt="" />
          <span>
            WellPoint<small>Safer water. Stronger communities.</small>
          </span>
        </Link>
        <nav className="links">
          {links.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className="right">
          <Link className="login" to="/login">Log in</Link>
          <Link className="btn p sm" to="/register">Sign up</Link>
          <button
            type="button"
            className="menu"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            Menu
          </button>
        </div>
      </div>
      {open && (
        <nav className="mlinks" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
        </nav>
      )}
    </header>
  );
}
