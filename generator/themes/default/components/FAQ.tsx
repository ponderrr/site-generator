export function FAQ({ items }:{ items:{q:string,a:string}[] }) {
  return (
    <div>
      {items?.map((f,i)=>(
        <details key={i} style={{margin:"12px 0"}}>
          <summary><strong>{f.q}</strong></summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}


