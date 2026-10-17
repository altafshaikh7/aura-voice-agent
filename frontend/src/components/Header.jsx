function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <span className="brand-mark">a</span>

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
