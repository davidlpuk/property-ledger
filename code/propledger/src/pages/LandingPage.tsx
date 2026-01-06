import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : '';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.querySelector(id);
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    closeMobileMenu();
  };

  const faqs = [
    { q: 'Do I need to connect my bank account?', a: 'No. PropLedger works with file uploads (CSV, OFX, PDF). Your banking credentials stay with you.' },
    { q: 'Is my data secure?', a: 'Yes. 256-bit encryption, EU servers, fully GDPR compliant. We never sell your data.' },
    { q: "What if I'm not tech-savvy?", a: 'If you can attach a file to an email, you can use PropLedger. We have tutorials and responsive support.' },
    { q: 'Does it work with Spanish tax requirements?', a: 'Absolutely. We handle IVA, SII exports, stressed areas, and Veri*Factu compliance.' },
    { q: 'Can my accountant access my data?', a: 'Yes. Pro and Business plans allow accountant access with customizable permissions.' },
  ];

  return (
    <>
      <style>{`
        .landing-page { --primary-purple: #5B4B8A; --primary-purple-hover: #4A3D73; --light-purple: #E8E4F0; --accent-teal: #4A9B8C; --dark-text: #333333; --medium-gray: #666666; --light-gray: #F8F8F8; --white: #FFFFFF; --container-max-width: 1200px; --section-padding: 80px; --section-padding-mobile: 48px; --radius-button: 8px; --radius-card: 12px; --radius-section: 16px; --shadow-card: 0 4px 20px rgba(91, 75, 138, 0.1); --shadow-hover: 0 8px 30px rgba(91, 75, 138, 0.15); --transition: all 0.3s ease; }
        .landing-page * { margin: 0; padding: 0; box-sizing: border-box; }
        .landing-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 18px; line-height: 28px; color: var(--medium-gray); background-color: var(--white); overflow-x: hidden; }
        .landing-page h1, .landing-page h2, .landing-page h3 { color: var(--dark-text); font-weight: 700; }
        .landing-page h1 { font-size: 48px; line-height: 56px; margin-bottom: 24px; }
        .landing-page h2 { font-size: 36px; line-height: 44px; margin-bottom: 20px; }
        .landing-page h3 { font-size: 24px; line-height: 32px; font-weight: 600; margin-bottom: 16px; }
        .landing-page a { text-decoration: none; color: inherit; transition: var(--transition); }
        .landing-page ul { list-style: none; }
        .landing-page .container { max-width: var(--container-max-width); margin: 0 auto; padding: 0 24px; }
        .landing-page .section { padding: var(--section-padding) 0; }
        .landing-page .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 24px; border-radius: var(--radius-button); font-weight: 600; cursor: pointer; transition: var(--transition); border: 2px solid transparent; font-size: 16px; }
        .landing-page .btn-primary { background-color: var(--primary-purple); color: var(--white); }
        .landing-page .btn-primary:hover { background-color: var(--primary-purple-hover); }
        .landing-page .btn-outline { border-color: var(--primary-purple); color: var(--primary-purple); background: transparent; }
        .landing-page .btn-outline:hover { background-color: var(--light-purple); }
        .landing-page .btn-large { padding: 16px 32px; font-size: 18px; }
        .landing-page .btn-white { background-color: var(--white); color: var(--primary-purple); }
        .landing-page .btn-white:hover { background-color: var(--light-purple); }
        .landing-page header { position: fixed; top: 0; left: 0; width: 100%; background: var(--white); z-index: 1000; transition: var(--transition); height: 80px; display: flex; align-items: center; }
        .landing-page header.scrolled { box-shadow: 0 2px 10px rgba(0,0,0,0.1); height: 70px; }
        .landing-page .header-container { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .landing-page .logo { font-size: 24px; font-weight: 700; color: var(--primary-purple); }
        .landing-page .nav-links { display: flex; gap: 32px; }
        .landing-page .nav-links a { font-size: 16px; font-weight: 500; color: var(--dark-text); }
        .landing-page .nav-links a:hover { color: var(--primary-purple); }
        .landing-page .auth-buttons { display: flex; gap: 16px; align-items: center; }
        .landing-page .mobile-toggle { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
        .landing-page .hero { padding-top: 160px; padding-bottom: 80px; background: linear-gradient(180deg, var(--light-purple) 0%, var(--white) 100%); }
        .landing-page .hero-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; }
        .landing-page .badge { display: inline-flex; align-items: center; gap: 8px; background: var(--white); padding: 6px 16px; border-radius: 100px; font-size: 14px; font-weight: 600; color: var(--primary-purple); margin-bottom: 24px; box-shadow: var(--shadow-card); }
        .landing-page .hero-content p { margin-bottom: 32px; font-size: 20px; }
        .landing-page .hero-ctas { display: flex; gap: 24px; align-items: center; margin-bottom: 24px; }
        .landing-page .cta-secondary { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--primary-purple); }
        .landing-page .hero-supporting { font-size: 14px; color: var(--medium-gray); }
        .landing-page .hero-image-placeholder { background: var(--white); border-radius: var(--radius-section); height: 400px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-hover); border: 1px solid var(--light-purple); color: var(--primary-purple); font-weight: 700; font-size: 24px; position: relative; overflow: hidden; }
        .landing-page .hero-image-placeholder::after { content: ""; position: absolute; top: 40px; left: 40px; right: 40px; bottom: 40px; border: 2px dashed var(--light-purple); border-radius: 8px; }
        .landing-page .trust-bar { background-color: var(--light-purple); padding: 40px 0; text-align: center; }
        .landing-page .trust-items { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; margin-bottom: 24px; }
        .landing-page .trust-item { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--primary-purple); font-size: 16px; }
        .landing-page .works-with { font-size: 14px; color: var(--medium-gray); }
        .landing-page .problem-solution { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        .landing-page .ps-label { text-transform: uppercase; font-size: 14px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; display: block; }
        .landing-page .problem .ps-label { color: #D97706; }
        .landing-page .solution .ps-label { color: var(--accent-teal); }
        .landing-page .ps-list { margin-top: 32px; display: flex; flex-direction: column; gap: 16px; }
        .landing-page .ps-item { display: flex; gap: 12px; align-items: flex-start; font-size: 16px; }
        .landing-page .ps-item svg { flex-shrink: 0; margin-top: 4px; }
        .landing-page .section-header { text-align: center; max-width: 700px; margin: 0 auto 60px; }
        .landing-page .features-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .landing-page .feature-card { background: var(--white); padding: 40px; border-radius: var(--radius-card); box-shadow: var(--shadow-card); transition: var(--transition); border: 1px solid var(--light-gray); }
        .landing-page .feature-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-hover); }
        .landing-page .feature-icon { width: 64px; height: 64px; background: var(--light-purple); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: var(--primary-purple); }
        .landing-page .how-it-works { background: var(--light-gray); border-radius: var(--radius-section); }
        .landing-page .steps-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; position: relative; margin-top: 60px; }
        .landing-page .steps-container::before { content: ""; position: absolute; top: 40px; left: 10%; right: 10%; height: 2px; background: var(--light-purple); z-index: 1; }
        .landing-page .step { text-align: center; position: relative; z-index: 2; }
        .landing-page .step-number { width: 80px; height: 80px; background: var(--primary-purple); color: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; margin: 0 auto 24px; border: 8px solid var(--light-gray); }
        .landing-page .step-time { display: inline-block; margin-top: 12px; font-size: 14px; font-weight: 700; color: var(--accent-teal); background: #E6F4F1; padding: 2px 12px; border-radius: 100px; }
        .landing-page .steps-footer { text-align: center; margin-top: 48px; font-weight: 600; color: var(--dark-text); }
        .landing-page .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
        .landing-page .grid-item { display: flex; gap: 20px; }
        .landing-page .grid-icon { flex-shrink: 0; color: var(--accent-teal); }
        .landing-page .grid-content h3 { font-size: 20px; margin-bottom: 8px; }
        .landing-page .grid-content p { font-size: 16px; }
        .landing-page .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .landing-page .testimonial-card { background: var(--white); padding: 32px; border-radius: var(--radius-card); box-shadow: var(--shadow-card); display: flex; flex-direction: column; }
        .landing-page .stars { color: #FBBF24; margin-bottom: 16px; }
        .landing-page .quote { font-style: italic; margin-bottom: 24px; flex-grow: 1; }
        .landing-page .author { display: flex; align-items: center; gap: 16px; }
        .landing-page .avatar { width: 48px; height: 48px; background: var(--light-purple); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--primary-purple); }
        .landing-page .author-info h4 { font-size: 16px; color: var(--dark-text); }
        .landing-page .author-info p { font-size: 14px; }
        .landing-page .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; align-items: flex-start; }
        .landing-page .pricing-card { background: var(--white); padding: 48px 32px; border-radius: var(--radius-card); border: 1px solid var(--light-gray); text-align: center; transition: var(--transition); }
        .landing-page .pricing-card.highlight { border: 2px solid var(--primary-purple); position: relative; transform: scale(1.05); box-shadow: var(--shadow-hover); }
        .landing-page .popular-badge { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: var(--primary-purple); color: var(--white); padding: 4px 16px; border-radius: 100px; font-size: 14px; font-weight: 700; }
        .landing-page .price { font-size: 48px; font-weight: 700; color: var(--dark-text); margin: 24px 0 8px; }
        .landing-page .price span { font-size: 18px; font-weight: 400; color: var(--medium-gray); }
        .landing-page .pricing-features { margin: 32px 0; text-align: left; display: flex; flex-direction: column; gap: 12px; }
        .landing-page .pricing-feature { display: flex; align-items: center; gap: 12px; font-size: 16px; }
        .landing-page .pricing-footer { text-align: center; margin-top: 40px; font-size: 14px; }
        .landing-page .faq-container { max-width: 800px; margin: 0 auto; }
        .landing-page .faq-item { border-bottom: 1px solid var(--light-purple); }
        .landing-page .faq-question { width: 100%; padding: 24px 0; display: flex; justify-content: space-between; align-items: center; background: none; border: none; text-align: left; font-size: 20px; font-weight: 600; color: var(--dark-text); cursor: pointer; }
        .landing-page .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
        .landing-page .faq-answer p { padding-bottom: 24px; font-size: 16px; }
        .landing-page .faq-item.active .faq-answer { max-height: 200px; }
        .landing-page .faq-icon { transition: transform 0.3s ease; }
        .landing-page .faq-item.active .faq-icon { transform: rotate(180deg); }
        .landing-page .final-cta { background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-purple-hover) 100%); color: var(--white); text-align: center; border-radius: var(--radius-section); margin-bottom: 80px; }
        .landing-page .final-cta h2, .landing-page .final-cta p { color: var(--white); }
        .landing-page .final-cta-buttons { display: flex; justify-content: center; gap: 24px; align-items: center; margin: 40px 0 24px; }
        .landing-page .final-cta-secondary { color: var(--white); font-weight: 600; text-decoration: underline; }
        .landing-page .final-cta-supporting { font-size: 14px; opacity: 0.8; }
        .landing-page footer { background: var(--light-gray); padding: 80px 0 40px; }
        .landing-page .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 60px; }
        .landing-page .footer-logo { font-size: 24px; font-weight: 700; color: var(--primary-purple); margin-bottom: 16px; display: block; }
        .landing-page .footer-tagline { font-size: 16px; margin-bottom: 24px; }
        .landing-page .social-links { display: flex; gap: 16px; }
        .landing-page .social-icon { width: 40px; height: 40px; background: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-purple); box-shadow: var(--shadow-card); }
        .landing-page .footer-column h4 { font-size: 18px; margin-bottom: 24px; color: var(--dark-text); }
        .landing-page .footer-links { display: flex; flex-direction: column; gap: 12px; }
        .landing-page .footer-links a { font-size: 16px; }
        .landing-page .footer-links a:hover { color: var(--primary-purple); }
        .landing-page .footer-bottom { border-top: 1px solid #E5E5E5; padding-top: 40px; display: flex; justify-content: space-between; font-size: 14px; }
        .landing-page .mobile-menu { position: fixed; top: 0; right: -100%; width: 80%; height: 100%; background: var(--white); z-index: 1001; padding: 40px; transition: right 0.3s ease; box-shadow: -10px 0 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 32px; }
        .landing-page .mobile-menu.active { right: 0; }
        .landing-page .mobile-menu-close { align-self: flex-end; background: none; border: none; cursor: pointer; }
        .landing-page .mobile-nav { display: flex; flex-direction: column; gap: 24px; }
        .landing-page .mobile-nav a { font-size: 20px; font-weight: 600; color: var(--dark-text); }
        .landing-page .mobile-auth { display: flex; flex-direction: column; gap: 16px; margin-top: auto; }
        .landing-page .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: none; }
        .landing-page .overlay.active { display: block; }
        .landing-page .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
        .landing-page .fade-in.visible { opacity: 1; transform: translateY(0); }
        @media (max-width: 1024px) { .landing-page h1 { font-size: 40px; line-height: 48px; } .landing-page .hero-grid { gap: 40px; } .landing-page .features-cards, .landing-page .pricing-grid, .landing-page .testimonials-grid { grid-template-columns: repeat(2, 1fr); } .landing-page .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .landing-page .section { padding: var(--section-padding-mobile) 0; } .landing-page .nav-links, .landing-page .auth-buttons { display: none; } .landing-page .mobile-toggle { display: block; } .landing-page .hero-grid { grid-template-columns: 1fr; text-align: center; } .landing-page .hero-ctas { justify-content: center; flex-direction: column; } .landing-page .hero-image-placeholder { height: 300px; } .landing-page .problem-solution { grid-template-columns: 1fr; gap: 48px; } .landing-page .features-cards, .landing-page .pricing-grid, .landing-page .testimonials-grid, .landing-page .features-grid { grid-template-columns: 1fr; } .landing-page .steps-container { grid-template-columns: 1fr; gap: 40px; } .landing-page .steps-container::before { display: none; } .landing-page .pricing-card.highlight { transform: none; } .landing-page .footer-grid { grid-template-columns: 1fr; } .landing-page .footer-bottom { flex-direction: column; gap: 16px; text-align: center; } }
      `}</style>

      <div className="landing-page">
        <div className={`overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={closeMobileMenu} />

        <header className={isScrolled ? 'scrolled' : ''}>
          <div className="container header-container">
            <a href="#" className="logo">PropLedger</a>
            <nav className="nav-links">
              <a href="#features" onClick={(e) => scrollToSection(e, '#features')}>Features</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')}>Pricing</a>
              <a href="#faq" onClick={(e) => scrollToSection(e, '#faq')}>FAQ</a>
            </nav>
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/login?signup=true" className="btn btn-primary">Sign Up</Link>
              <Link to="/demo" className="btn btn-outline ml-2" style={{ borderStyle: 'dashed' }}>🎮 Demo</Link>
            </div>
            <button className="mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </header>

        <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <button className="mobile-menu-close" onClick={closeMobileMenu}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <nav className="mobile-nav">
            <a href="#features" onClick={(e) => scrollToSection(e, '#features')}>Features</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')}>Pricing</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, '#faq')}>FAQ</a>
          </nav>
          <div className="mobile-auth">
            <Link to="/login" className="btn btn-outline" onClick={closeMobileMenu}>Login</Link>
            <Link to="/login?signup=true" className="btn btn-primary" onClick={closeMobileMenu}>Sign Up</Link>
          </div>
        </div>

        <main>
          <section className="hero">
            <div className="container hero-grid">
              <div className="hero-content fade-in">
                <div className="badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Trusted by 5,000+ Spanish Landlords
                </div>
                <h1>Stop Dreading Tax Season.<br />Start Feeling in Control.</h1>
                <p>PropLedger transforms chaotic bank statements into compliant, organized financial reports—so you can manage your rental properties with confidence, not anxiety.</p>
                <div className="hero-ctas">
                  <Link to="/login?signup=true" className="btn btn-primary btn-large">
                    Start Free Trial
                    <svg style={{ marginLeft: 8 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </Link>
                  <a href="#" className="cta-secondary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                    See How It Works
                  </a>
                </div>
                <p className="hero-supporting">No credit card required • Setup in 5 minutes • Cancel anytime</p>
              </div>
              <div className="hero-image fade-in">
                <div className="hero-image-placeholder">Dashboard Preview</div>
              </div>
            </div>
          </section>

          <div className="trust-bar">
            <div className="container">
              <div className="trust-items">
                <div className="trust-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>GDPR Compliant</div>
                <div className="trust-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Bank-Level Security</div>
                <div className="trust-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>AEAT & Veri*Factu Ready</div>
              </div>
              <p className="works-with">Works with: Santander • BBVA • CaixaBank • Sabadell • Bankinter • ING</p>
            </div>
          </div>

          <section className="section container">
            <div className="problem-solution">
              <div className="problem fade-in">
                <span className="ps-label">The Challenge</span>
                <h2>Managing Rental Finances Shouldn't Feel This Hard</h2>
                <p>You inherited a few apartments or built a small property portfolio. Now you're drowning in bank statements, second-guessing every deduction, and losing sleep before tax deadlines.</p>
                <div className="ps-list">
                  {['Scattered bank files across multiple accounts', 'Uncertainty about which expenses are deductible', 'Hours lost on manual categorization', 'Anxiety about compliance mistakes'].map((item, i) => (
                    <div className="ps-item" key={i}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>{item}</div>
                  ))}
                </div>
              </div>
              <div className="solution fade-in">
                <span className="ps-label">The Solution</span>
                <h2>Finally, a Financial Tool That Gets Landlords</h2>
                <p>PropLedger was built specifically for Spanish independent landlords. Upload your bank files, let our AI handle the categorization, and generate tax-ready reports in minutes.</p>
                <div className="ps-list">
                  {['One place for all your rental finances', 'AI suggests the right categories', 'Reports ready in minutes, not hours', 'Always compliant with Spanish regulations'].map((item, i) => (
                    <div className="ps-item" key={i}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A9B8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="section container">
            <div className="section-header fade-in">
              <h2>Everything You Need. Nothing You Don't.</h2>
              <p>We've stripped away the complexity and kept only what matters to landlords.</p>
            </div>
            <div className="features-cards">
              <div className="feature-card fade-in">
                <div className="feature-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></div>
                <h3>Smart File Upload</h3>
                <p>Drag and drop bank statements (CSV, OFX, PDF). Our AI parses transactions instantly and suggests categories based on your properties.</p>
              </div>
              <div className="feature-card fade-in">
                <div className="feature-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12L2.1 12.1"></path><circle cx="12" cy="12" r="2"></circle></svg></div>
                <h3>AI-Powered Categorization</h3>
                <p>PropLedger learns how you categorize. After a few uses, it handles 85% of transactions automatically—you just confirm.</p>
              </div>
              <div className="feature-card fade-in">
                <div className="feature-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 11 12 14 15 11"></polyline></svg></div>
                <h3>Built-In Compliance</h3>
                <p>IVA calculations, SII exports, Veri*Factu ready. We track Spanish regulations so your reports are always audit-ready.</p>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container how-it-works section">
              <div className="section-header fade-in">
                <h2>From Bank Statement to Tax Report in 4 Steps</h2>
                <p>No accounting degree required.</p>
              </div>
              <div className="steps-container">
                {[{ num: 1, title: 'Download Your Bank File', desc: 'Export CSV or OFX from your online banking.', time: '30 sec' }, { num: 2, title: 'Upload to PropLedger', desc: 'Drag and drop. We parse and match to your properties.', time: '1 min' }, { num: 3, title: 'Review AI Suggestions', desc: 'Accept, adjust, or create rules for the future.', time: '5 min' }, { num: 4, title: 'Generate Reports', desc: 'One click for tax-ready reports and SII exports.', time: 'Instant' }].map((step) => (
                  <div className="step fade-in" key={step.num}><div className="step-number">{step.num}</div><h3>{step.title}</h3><p>{step.desc}</p><span className="step-time">{step.time}</span></div>
                ))}
              </div>
              <p className="steps-footer fade-in">Average time saved: 3 hours per month</p>
            </div>
          </section>

          <section className="section container">
            <div className="section-header fade-in"><h2>What Landlords Are Saying</h2></div>
            <div className="testimonials-grid">
              {[{ quote: 'I used to spend an entire weekend before quarterly filing. Now it takes 20 minutes.', name: 'Maria G.', role: '3 apartments in Madrid', initials: 'MG' }, { quote: 'Finally, software that understands Spanish rental regulations. The stressed area feature saved me from a costly mistake.', name: 'Carlos R.', role: '5 properties in Barcelona', initials: 'CR' }, { quote: "I'm not tech-savvy, but PropLedger is so simple. My accountant loves the reports.", name: 'Pilar M.', role: '2 apartments in Valencia', initials: 'PM' }].map((t, i) => (
                <div className="testimonial-card fade-in" key={i}><div className="stars">★★★★★</div><p className="quote">"{t.quote}"</p><div className="author"><div className="avatar">{t.initials}</div><div className="author-info"><h4>{t.name}</h4><p>{t.role}</p></div></div></div>
              ))}
            </div>
          </section>

          <section id="pricing" className="section container">
            <div className="section-header fade-in">
              <h2>Simple Pricing. No Surprises.</h2>
              <p>Start free, upgrade when ready. All plans include Spanish compliance tools.</p>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card fade-in">
                <h3>Starter</h3>
                <div className="price">€0<span>/month</span></div>
                <div className="pricing-features">
                  {['1 property', '50 transactions/month', 'Basic categorization', 'Email support'].map((f, i) => (<div className="pricing-feature" key={i}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A9B8C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>{f}</div>))}
                </div>
                <Link to="/login?signup=true" className="btn btn-outline" style={{ width: '100%' }}>Start Free</Link>
              </div>
              <div className="pricing-card highlight fade-in">
                <div className="popular-badge">Most Popular</div>
                <h3>Pro</h3>
                <div className="price">€12<span>/month</span></div>
                <p style={{ fontSize: 14, marginTop: -8 }}>billed annually</p>
                <div className="pricing-features">
                  {['Up to 5 properties', 'Unlimited transactions', 'AI categorization', 'SII export', 'Priority support', 'Mobile app'].map((f, i) => (<div className="pricing-feature" key={i}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A9B8C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>{f}</div>))}
                </div>
                <Link to="/login?signup=true" className="btn btn-primary" style={{ width: '100%' }}>Start Free Trial</Link>
              </div>
              <div className="pricing-card fade-in">
                <h3>Business</h3>
                <div className="price">€29<span>/month</span></div>
                <p style={{ fontSize: 14, marginTop: -8 }}>billed annually</p>
                <div className="pricing-features">
                  {['Unlimited properties', 'Everything in Pro', 'Veri*Factu e-invoicing', 'Tenant management', 'Accountant sharing', 'API access'].map((f, i) => (<div className="pricing-feature" key={i}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A9B8C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>{f}</div>))}
                </div>
                <a href="#" className="btn btn-outline" style={{ width: '100%' }}>Contact Sales</a>
              </div>
            </div>
            <p className="pricing-footer">All prices exclude IVA. 14-day free trial. Cancel anytime.</p>
          </section>

          <section id="faq" className="section container">
            <div className="section-header fade-in"><h2>Frequently Asked Questions</h2></div>
            <div className="faq-container">
              {faqs.map((faq, i) => (
                <div className={`faq-item fade-in ${activeFaq === i ? 'active' : ''}`} key={i}>
                  <button className="faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>{faq.q}<svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                  <div className="faq-answer"><p>{faq.a}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="container">
            <div className="final-cta section fade-in">
              <h2>Ready to Take Control of Your Rental Finances?</h2>
              <p>Join thousands of Spanish landlords who've reclaimed their weekends.</p>
              <div className="final-cta-buttons">
                <Link to="/login?signup=true" className="btn btn-white btn-large">Start Your Free Trial</Link>
                <a href="#" className="final-cta-secondary">Schedule a Demo</a>
              </div>
              <p className="final-cta-supporting">Free 14-day trial • No credit card • Cancel anytime</p>
            </div>
          </section>
        </main>

        <footer>
          <div className="container">
            <div className="footer-grid">
              <div className="footer-column">
                <a href="#" className="footer-logo">PropLedger</a>
                <p className="footer-tagline">Financial clarity for Spanish landlords.</p>
                <div className="social-links">
                  <a href="#" className="social-icon" aria-label="LinkedIn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
                  <a href="#" className="social-icon" aria-label="Twitter"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></a>
                </div>
              </div>
              <div className="footer-column"><h4>Product</h4><div className="footer-links"><a href="#features" onClick={(e) => scrollToSection(e, '#features')}>Features</a><a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')}>Pricing</a><a href="#">Mobile App</a></div></div>
              <div className="footer-column"><h4>Resources</h4><div className="footer-links"><a href="#">Help Center</a><a href="#">Blog</a><a href="#">Tax Guides</a></div></div>
              <div className="footer-column"><h4>Company</h4><div className="footer-links"><a href="#">About</a><a href="#">Contact</a><a href="#">Privacy Policy</a><a href="#">Terms</a></div></div>
            </div>
            <div className="footer-bottom"><p>© 2026 PropLedger S.L. All rights reserved.</p><p>Made with love in Madrid</p></div>
          </div>
        </footer>
      </div>
    </>
  );
}
