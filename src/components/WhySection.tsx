import { principles } from '../data/siteData'

export function WhySection() {
  return (
    <section className="why-section content-section">
      <div className="section-kicker">08 — Why LoCoDex</div>
      <div className="why-heading"><h2>Evidence over <em>volume.</em></h2><p>LoCoDex’s differentiators are implementation choices, not slogans.</p></div>
      <div className="principles-grid">
        {principles.map((principle) => (
          <div key={principle.index} className={`principle accent-${principle.tone}`}>
            <div className="principle-top"><span className="principle-index">{principle.index}</span><span className="principle-tag">{principle.tag}</span></div>
            <span className="principle-icon">{principle.icon}</span>
            <h3>{principle.title}</h3>
            <p>{principle.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
