function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <img
          className="brand-logo"
          src="/aura-logo.png"
          alt="Aura Skincare logo"
          width="36"
          height="36"
        />

        <span className="brand-copy">
          <strong>Aura</strong>
          <small>SKINCARE</small>
        </span>
      </a>

      <div className="topbar-right">
        <span className="online-dot" />
        <span>AI Customer Support</span>
        <span className="agent-badge">ARIA AI</span>
      </div>
    </header>
  );
}

export default Header;
