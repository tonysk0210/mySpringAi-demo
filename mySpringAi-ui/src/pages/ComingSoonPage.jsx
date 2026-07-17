export default function ComingSoonPage({ title, endpoint, description }) {
  return (
    <article className="api-page coming-soon-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">COMING SOON</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <code>API 端口：{endpoint}</code>
      </header>
      <section className="coming-soon-card">
        <span>◇</span>
        <h2>This demo page is reserved</h2>
        <p>The backend endpoint is available. Its purpose-built controls and output preview will be added in a later iteration.</p>
      </section>
    </article>
  )
}
