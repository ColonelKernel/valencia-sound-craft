const NotFound = () => (
  <main className="not-found-shell">
    <a className="wordmark wordmark--light" href="/" aria-label="Zach Scheffler, home">
      ZS<span aria-hidden="true">/</span>Research
    </a>
    <div className="not-found-copy">
      <p className="section-kicker">404 / Page not found</p>
      <h1>Page not found. This portfolio has been consolidated.</h1>
      <p>
        The requested route belonged to an earlier version of the site. The current dossier focuses on
        DAW state, intelligent music production, and human–AI performance systems.
      </p>
      <a className="button button--light" href="/">
        Return home to the research dossier <span aria-hidden="true">↗</span>
      </a>
    </div>
  </main>
);

export default NotFound;
