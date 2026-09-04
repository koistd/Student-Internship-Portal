import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import "./Home.css";

const steps = [
  { number: "01", icon: "⌕", title: "Browse & Filter", text: "Search hundreds of internships by location, industry, and duration." },
  { number: "02", icon: "↗", title: "Apply Instantly", text: "Submit your resume and cover letter in minutes, all in one place." },
  { number: "03", icon: "◴", title: "Track Progress", text: "Follow your application through every stage with clear updates." },
];

const testimonials = [
  { quote: "InternLink helped me find a role that actually matched my interests. I had an offer within three weeks.", name: "Aarav Mehta", title: "Software Engineering Intern" },
  { quote: "We reached talented students faster and cut our hiring time nearly in half. It is now part of our core process.", name: "Neha Kapoor", title: "Talent Lead, TechNova" },
  { quote: "The progress tracking made the whole process feel transparent. I always knew what to expect next.", name: "Riya Sharma", title: "Data Science Intern" },
];

function scrollToSection(event, id, closeMenu) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  closeMenu();
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [internships, setInternships] = useState([]);
  const [internshipCount, setInternshipCount] = useState(0);
  const [savedIds, setSavedIds] = useState(() => JSON.parse(localStorage.getItem("saved_internships") || "[]"));

  useEffect(() => {
    api.get("/internships/")
      .then(({ data }) => {
        setInternshipCount(data.count ?? data.length ?? 0);
        setInternships((data.results || data).slice(0, 3));
      })
      .catch(() => setInternships([]));
  }, []);

  const toggleSaved = (id) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id];
      localStorage.setItem("saved_internships", JSON.stringify(next));
      return next;
    });
  };

  const closeMenu = () => setMenuOpen(false);
  const sectionLink = (id, label) => (
    <a href={`#${id}`} onClick={(event) => scrollToSection(event, id, closeMenu)}>{label}</a>
  );

  return (
    <div className="home-page">
      <header className="home-nav">
        <a className="home-logo" href="#home" onClick={(event) => scrollToSection(event, "home", closeMenu)}>
          <span className="home-logo-mark">i</span>
          <span>Intern<span>Link</span></span>
        </a>
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? "×" : "☰"}</button>
        <nav className={`home-nav-links ${menuOpen ? "is-open" : ""}`}>
          {sectionLink("home", "Home")}
          {sectionLink("internships", "Internships")}
          {sectionLink("about", "About")}
          {sectionLink("contact", "Contact")}
          <div className="home-nav-actions">
            <Link className="button button-outline" to="/login" onClick={closeMenu}>Log In</Link>
            <Link className="button button-orange" to="/register" onClick={closeMenu}>Get Started <span aria-hidden="true">→</span></Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-grid" />
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow"><span>✦</span> Live internship opportunities <b>now available</b></p>
              <h1>Build the career<br /><em>you imagine.</em></h1>
              <p className="hero-lede">Explore real opportunities from partner employers and apply to internships that match your skills, location, and career goals.</p>
              <div className="hero-actions">
                <Link className="button button-orange button-large" to="/internships">Browse Internships <span aria-hidden="true">↗</span></Link>
                <a className="button button-hero-outline button-large" href="#contact" onClick={(event) => scrollToSection(event, "contact", closeMenu)}>For Employers <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <div className="hero-art" aria-label="Illustration of connected career opportunities" role="img">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="art-card art-card-top"><span className="art-icon">✓</span><span><strong>Application accepted</strong><small>Frontend Developer</small></span></div>
              <div className="art-card art-card-bottom"><span className="art-avatar">AM</span><span><strong>Aarav Mehta</strong><small>Matched with 8 roles</small></span><span className="match">94%</span></div>
              <div className="art-center"><span>i</span></div>
            </div>
          </div>
          <div className="stats-row">
            <div><strong>{internshipCount}<span>+</span></strong><small>Live opportunities</small></div>
            <div><strong>Live</strong><small>API availability</small></div>
            <div><strong>JWT</strong><small>Secure sign-in</small></div>
          </div>
        </section>

        <section className="section how-section" id="about">
          <div className="section-heading"><p className="section-kicker">A clearer way forward</p><h2>How it works</h2><p>From searching to signing, your next opportunity is only three simple steps away.</p></div>
          <div className="steps-grid">{steps.map((step) => <article className="step-card" key={step.number}><div className="step-top"><span className="step-icon">{step.icon}</span><span className="step-number">{step.number}</span></div><h3>{step.title}</h3><p>{step.text}</p><span className="step-line" /></article>)}</div>
        </section>

        <section className="section internships-section" id="internships">
          <div className="section-heading split-heading"><div><p className="section-kicker">Curated for your growth</p><h2>Featured internships</h2><p>Good work starts with a good match.</p></div><Link className="text-link" to="/internships">View all opportunities <span>→</span></Link></div>
          <div className="internship-grid">{internships.map((internship) => <article className="featured-card" key={internship.id}><div className="featured-top"><span className="featured-badge">OPEN</span><button className="save-button" type="button" aria-label={`${savedIds.includes(internship.id) ? "Remove" : "Save"} ${internship.title}`} onClick={() => toggleSaved(internship.id)}>{savedIds.includes(internship.id) ? "♥" : "♡"}</button></div><div className="company-mark blue">{internship.company_name?.slice(0, 2).toUpperCase() || "IN"}</div><h3>{internship.title}</h3><p className="company-name">{internship.company_name || "Partner company"}</p><div className="job-meta"><span>⌖ {internship.location}</span><span>◷ {internship.duration}</span></div><div className="job-footer"><div><small>Stipend</small><strong>{internship.stipend}</strong></div><div><small>Apply by</small><strong>{internship.deadline}</strong></div></div><Link className="apply-link" to="/login">Apply now <span>↗</span></Link></article>)}</div>
          {!internships.length && <p className="empty-featured">No featured internships are available right now.</p>}
        </section>

        <section className="section testimonials-section">
          <div className="section-heading"><p className="section-kicker">Real people, real progress</p><h2>What people say</h2></div>
          <div className="testimonial-grid">{testimonials.map((testimonial) => <article className="testimonial-card" key={testimonial.name}><div className="stars" aria-label="5 out of 5 stars">★★★★★</div><blockquote>“{testimonial.quote}”</blockquote><div className="person"><span>{testimonial.name.split(" ").map((part) => part[0]).join("")}</span><p><strong>{testimonial.name}</strong><small>{testimonial.title}</small></p></div></article>)}</div>
        </section>

        <section className="contact-band" id="contact"><div><p className="section-kicker">For growing teams</p><h2>Meet your next great hire.</h2><p>Reach motivated students ready to make an impact from day one.</p></div><Link className="button button-orange button-large" to="/register">Post an internship <span>↗</span></Link></section>
      </main>

      <footer className="home-footer"><a className="home-logo" href="#home" onClick={(event) => scrollToSection(event, "home", closeMenu)}><span className="home-logo-mark">i</span><span>Intern<span>Link</span></span></a><p>Where ambition meets opportunity.</p><div className="footer-links"><a href="#contact" onClick={(event) => scrollToSection(event, "contact", closeMenu)}>Contact</a></div><small>© 2026 InternLink. Built for what comes next.</small></footer>
    </div>
  );
}
