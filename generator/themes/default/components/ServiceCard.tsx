interface Service {
  title: string;
  description: string;
  image?: string;
  icon?: string;
}

interface ServiceCardProps {
  service: Service;
  delay?: number;
}

export function ServiceCard({ service, delay = 0 }: ServiceCardProps) {
  return (
    <div 
      className="card animate-fade-in-up" 
      style={{ 
        animationDelay: `${delay}s`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {service.image ? (
        <div style={{ 
          width: '100%', 
          height: '200px', 
          overflow: 'hidden',
          borderRadius: '8px 8px 0 0',
          marginBottom: '20px'
        }}>
          <img 
            src={service.image} 
            alt={service.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            loading="lazy"
          />
        </div>
      ) : service.icon && (
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: '20px', 
          color: 'var(--primary)', 
          textAlign: 'center' 
        }}>
          {service.icon}
        </div>
      )}
      <h3 style={{ 
        marginBottom: '16px', 
        color: 'var(--text)', 
        textAlign: 'center', 
        fontSize: '1.5rem',
        flex: '0 0 auto'
      }}>
        {service.title}
      </h3>
      <p style={{ 
        color: 'var(--text-light)', 
        textAlign: 'center', 
        lineHeight: '1.6', 
        margin: 0,
        flex: '1 1 auto'
      }}>
        {service.description}
      </p>
    </div>
  );
}
