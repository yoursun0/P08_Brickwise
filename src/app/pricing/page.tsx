const PACKAGES = [
  { name: "入門", credits: 10, price: "HK$98", active: false },
  { name: "標準", credits: 30, price: "HK$258", active: true },
  { name: "專業", credits: 80, price: "HK$638", active: false },
];

export default function PricingPage() {
  return (
    <div className="wf-page">
      <div className="wf-panel" style={{ textAlign: "center" }}>
        <span className="wf-kicker">Pricing</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>購買 Credits</h1>
        <p className="wf-subtitle" style={{ margin: "12px auto 0" }}>每位用戶每月免費 3 credits。不足時可購買。</p>
      </div>
      <div className="wf-pricing-grid">
        {PACKAGES.map((p) => (
          <div className={`wf-price-card${p.active ? " active" : ""}`} key={p.name}>
            <strong style={{ display: "block", marginBottom: 8 }}>{p.name}</strong>
            <div className="wf-price">{p.price}</div>
            <small style={{ display: "block", marginTop: 8, color: "var(--bw-ink-2)" }}>{p.credits} credits</small>
            <button className="wf-button" style={{ marginTop: 16, width: "100%" }} disabled>購買（稍後推出）</button>
          </div>
        ))}
      </div>
    </div>
  );
}