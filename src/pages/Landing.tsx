import { Link } from 'react-router-dom';
import { Handbag, MapPin, Heart, Search, Sparkles, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} /> Your neighborhood, always prepared
          </div>
          <h1>What's in <em>Mom's Purse?</em></h1>
          <p className="hero-sub">
            Need gum at the park? Sunscreen at the beach? Find a Mom nearby who has exactly what you need. Tip them for saving your day.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary btn-lg">
              Find a Mom <ArrowRight size={18} />
            </Link>
            <Link to="/signup?role=mom" className="btn-outline btn-lg">
              Become a Mom <Handbag size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon"><Search size={28} /></div>
            <h3>Search</h3>
            <p>Browse items available from Moms near you — gum, sunscreen, band-aids, and more.</p>
          </div>
          <div className="step">
            <div className="step-icon"><MapPin size={28} /></div>
            <h3>Connect</h3>
            <p>Request what you need and meet up with a Mom nearby who has it.</p>
          </div>
          <div className="step">
            <div className="step-icon"><Heart size={28} /></div>
            <h3>Tip</h3>
            <p>Show your appreciation with a tip. Moms save the day, you say thanks.</p>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <h2>What Moms carry</h2>
        <div className="category-cards">
          {[
            { icon: '🍬', label: 'Snacks & Gum', desc: 'Mints, granola bars, fruit snacks' },
            { icon: '💊', label: 'Health & Medicine', desc: 'Band-aids, pain relief, allergy meds' },
            { icon: '🏖️', label: 'Beach Essentials', desc: 'Sunscreen, aloe, wipes' },
            { icon: '🍼', label: 'Baby Supplies', desc: 'Diapers, wipes, snacks' },
            { icon: '💄', label: 'Beauty & Care', desc: 'Lip balm, lotion, hair ties' },
            { icon: '👜', label: 'General', desc: 'Pens, chargers, tissues' },
          ].map((c) => (
            <div key={c.label} className="category-card">
              <span className="category-emoji">{c.icon}</span>
              <h3>{c.label}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to carry the purse?</h2>
        <p>Sign up as a Mom and start helping people around you. Earn tips for items you already carry.</p>
        <Link to="/signup?role=mom" className="btn-primary btn-lg">
          Become a Mom <Handbag size={18} />
        </Link>
      </section>
    </div>
  );
}
