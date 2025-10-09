export function FeatureList({ items }:{ items: string[] }) {
  return <ul>{items?.map((x,i)=><li key={i}>{x}</li>)}</ul>;
}


