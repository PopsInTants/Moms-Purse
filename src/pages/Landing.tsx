import { Link } from 'react-router-dom';
import { Handbag, MapPin, Heart, Search, Sparkles, ArrowRight, Star, Shield } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} /> Your safety net when there's no store around
          </div>
          <h1>What's in <em>Mom's Purse?</em></h1>
          <p className="hero-sub">
            Need sunscreen at the beach? A bandaid at the park? Find a MOM nearby — a Mobile Outpost Member — who has exactly what you need. Tip them for saving your day.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary btn-lg">
              Find a MOM <ArrowRight size={18} />
            </Link>
            <Link to="/signup?role=mom" className="btn-outline btn-lg">
              Become a MOM <Handbag size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon"><Search size={28} /></div>
            <h3>Search or Broadcast</h3>
            <p>Browse items from nearby MOMs, or post an "In Need Of" broadcast and let them come to you.</p>
          </div>
          <div className="step">
            <div className="step-icon"><MapPin size={28} /></div>
            <h3>Connect & Meet</h3>
            <p>Request what you need and meet up with a verified MOM nearby who has it.</p>
          </div>
          <div className="step">
            <div className="step-icon"><Heart size={28} /></div>
            <h3>Tip & Rate</h3>
            <p>Show your appreciation with a tip. Both sides rate the exchange to build community trust.</p>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <h2>What MOMs carry</h2>
        <p className="section-sub">Community-approved items only — no loose medications or open food with allergen risk.</p>
        <div className="category-cards">
          {[
            { icon: '☀️', label: 'Sunscreen & Sun Care', desc: 'SPF, aloe vera, after-sun' },
            { icon: '🩹', label: 'First Aid', desc: 'Band-aids, moleskin, antiseptic' },
            { icon: '🎀', label: 'Hair & Accessories', desc: 'Hair ties, safety pins, clips' },
            { icon: '💄', label: 'Chapstick & Beauty', desc: 'Lip balm, lotion, hand sanitizer' },
            { icon: '🧴', label: 'Tide Pen & Laundry', desc: 'Stain removers, wipes' },
            { icon: '🍬', label: 'Gum & Mints', desc: 'Gum, mints, breath strips' },
            { icon: '🔌', label: 'Phone Chargers', desc: 'Lightning, USB-C, micro-USB' },
            { icon: '📌', label: 'General', desc: 'Tissues, floss picks, bug spray' },
          ].map((c) => (
            <div key={c.label} className="category-card">
              <span className="category-emoji">{c.icon}</span>
              <h3>{c.label}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="trust-section">
        <h2>Built on trust</h2>
        <div className="trust-features">
          <div className="trust-feature">
            <Shield size={28} />
            <h3>Verified MOMs</h3>
            <p>Photo, name, and phone verification required for every MOM on the platform.</p>
          </div>
          <div className="trust-feature">
            <Star size={28} />
            <h3>Two-way ratings</h3>
            <p>Both MOMs and Seekers rate each other after every exchange. Trust is earned.</p>
          </div>
          <div className="trust-feature">
            <MapPin size={28} />
            <h3>Live map</h3>
            <p>See active MOMs near you in real time. Know who's around before you need them.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to carry the purse?</h2>
        <p>Sign up as a MOM and start helping people around you. Earn tips for items you already carry.</p>
        <Link to="/signup?role=mom" className="btn-primary btn-lg">
          Become a MOM <Handbag size={18} />
        </Link>
      </section>
    </div>
  );
}
