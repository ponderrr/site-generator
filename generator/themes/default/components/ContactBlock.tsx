export function ContactBlock({ phone, email }:{ phone?:string; email?:string }) {
  return (
    <div style={{ borderTop:"1px solid #e5e7eb", paddingTop:12 }}>
      {phone ? <p>Phone: <a href={`tel:${phone}`}>{phone}</a></p> : null}
      {email ? <p>Email: <a href={`mailto:${email}`}>{email}</a></p> : null}
    </div>
  );
}


