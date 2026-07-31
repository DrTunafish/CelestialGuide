type LoaderVariant = 'orbit' | 'constellation' | 'radar' | 'scan';

type CelestialLoaderProps = {
  variant?: LoaderVariant;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 36,
  md: 48,
  lg: 64,
};

export default function CelestialLoader({
  variant = 'orbit',
  label,
  size = 'md',
}: CelestialLoaderProps) {
  const dimension = sizeMap[size];

  if (variant === 'constellation') {
    return (
      <div className="celestial-loader" role="status" aria-label={label || 'Loading'}>
        <div className="celestial-loader__constellation" style={{ width: dimension, height: dimension }}>
          <span style={{ animationDelay: '0s' }} />
          <span style={{ animationDelay: '0.2s' }} />
          <span style={{ animationDelay: '0.4s' }} />
          <span style={{ animationDelay: '0.6s' }} />
          <span style={{ animationDelay: '0.8s' }} />
        </div>
        {label ? <p className="celestial-loader__label">{label}</p> : null}
      </div>
    );
  }

  if (variant === 'radar') {
    return (
      <div className="celestial-loader" role="status" aria-label={label || 'Scanning'}>
        <div className="celestial-loader__radar" style={{ width: dimension, height: dimension }}>
          <span className="celestial-loader__radar-sweep" />
        </div>
        {label ? <p className="celestial-loader__label">{label}</p> : null}
      </div>
    );
  }

  if (variant === 'scan') {
    return (
      <div className="celestial-loader" role="status" aria-label={label || 'Loading'}>
        <span className="scan-loader" style={{ width: dimension, height: dimension }}>
          <span className="scan-loader__beam" />
        </span>
        {label ? <p className="celestial-loader__label">{label}</p> : null}
      </div>
    );
  }

  return (
    <div className="celestial-loader" role="status" aria-label={label || 'Loading'}>
      <div className="celestial-loader__orbit" style={{ width: dimension, height: dimension }}>
        <span className="celestial-loader__sun" />
        <span className="celestial-loader__planet" />
        <span className="celestial-loader__ring" />
      </div>
      {label ? <p className="celestial-loader__label">{label}</p> : null}
    </div>
  );
}
