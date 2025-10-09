export function PageHeader({ title, subtitle }:{ title: string; subtitle?: string }) {
  return (
    <header style={{ margin: "16px 0 24px" }}>
      <h1 style={{ marginBottom: 8 }}>{title}</h1>
      {subtitle ? <p style={{ color: "#475569" }}>{subtitle}</p> : null}
    </header>
  );
}


