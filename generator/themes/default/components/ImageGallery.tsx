interface Image {
  url: string;
  alt: string;
  title?: string;
}

interface ImageGalleryProps {
  images: Image[];
  columns?: number;
  className?: string;
}

export function ImageGallery({ images, columns = 3, className = "" }: ImageGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div 
      className={`image-gallery ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 2 ? '300px' : '250px'}, 1fr))`,
        gap: '24px',
        marginTop: '32px',
        marginBottom: '32px'
      }}
    >
      {images.map((image, index) => (
        <div 
          key={index}
          className="image-card animate-fade-in-up"
          style={{
            animationDelay: `${index * 0.1}s`,
            overflow: 'hidden',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
          }}
        >
          <img
            src={image.url}
            alt={image.alt}
            title={image.title}
            style={{
              width: '100%',
              height: '250px',
              objectFit: 'cover',
              display: 'block'
            }}
            loading="lazy"
          />
          {image.alt && (
            <div style={{
              padding: '12px 16px',
              background: 'white',
              fontSize: '0.875rem',
              color: '#64748b',
              textAlign: 'center'
            }}>
              {image.alt}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
