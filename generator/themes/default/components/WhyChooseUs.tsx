import React from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface WhyChooseUsProps {
  title?: string;
  features: Feature[];
}

export function WhyChooseUs({ 
  title = "Why Choose Us?",
  features 
}: WhyChooseUsProps) {
  return (
    <section className="section">
      <div className="container">
        <h2 
          className="text-center text-4xl font-bold text-zinc-900 mb-12 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="card animate-fade-in-up"
              style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
            >
              <div className="text-5xl mb-6 text-center">{feature.icon}</div>
              <h3 className="text-xl font-bold text-zinc-900 mb-4 text-center">
                {feature.title}
              </h3>
              <p className="text-zinc-600 text-center leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




