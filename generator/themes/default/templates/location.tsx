import Layout from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { CTA } from "../components/CTA";

export default function LocationTemplate({ meta, tokens, children }:{
  meta: { title?: string; description?: string; page_type?: string },
  tokens: any,
  children: React.ReactNode
}) {
  return (
    <Layout title={meta.title} description={meta.description}>
      <PageHeader title={meta.title || "Location"} subtitle={meta.description} />
      <Section>{children}</Section>
      <Section><CTA label={tokens?.copy?.genericCtaLabel || tokens?.primaryCta} /></Section>
    </Layout>
  );
}




