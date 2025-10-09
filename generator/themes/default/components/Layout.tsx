export default function Layout({ title, description, children }:{
  title?: string, description?: string, children: React.ReactNode
}) {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      {title ? <h1 style={{ marginBottom: 8 }}>{title}</h1> : null}
      {description ? <p style={{ color: "#475569", marginTop: 0 }}>{description}</p> : null}
      <div style={{ marginTop: 24 }}>{children}</div>
    </div>
  );
}


