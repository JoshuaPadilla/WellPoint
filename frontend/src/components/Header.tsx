import { Link } from '@tanstack/react-router'

export function Header() {
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
          <a href="#features">Features</a>
          <a href="#sources">Water sources</a>
          <a href="#how">How it works</a>
        </nav>
        {/* <div className="right">
          <Link className="login" to="/login">
            Log in
          </Link>
          <Link className="btn p sm" to="/register">
            Sign up
          </Link>
        </div> */}
      </div>
    </header>
  )
}
