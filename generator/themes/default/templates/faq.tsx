import Layout from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { CTA } from "../components/CTA";

export default function FAQTemplate({ meta, tokens, children }:{
  meta: { title?: string; description?: string; page_type?: string },
  tokens: any,
  children: React.ReactNode
}) {
  return (
    <Layout title={meta.title} description={meta.description}>
      <PageHeader title={meta.title || "FAQ"} subtitle={meta.description} />
      <Section>{children}</Section>
      <Section><CTA label="Get a Free Quote" /></Section>
    </Layout>
  );
}




