export function CTA({ label, href = "/contact" }:{ label: string; href?: string }) {
  return (
    <a href={href} style={{
      display:"inline-block", padding:"10px 16px", borderRadius:10,
      border:"1px solid #0ea5e9", textDecoration:"none"
    }}>{label}</a>
  );
}


