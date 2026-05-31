import { useEffect } from 'react';

interface AdSenseProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

/**
 * AdSense Component
 * Reusable ad placement component for Google AdSense
 * 
 * @example
 * import { AdSense } from './components/AdSense';
 * import { AD_PLACEMENTS } from './config/adSenseSlots';
 * 
 * <AdSense 
 *   slot={AD_PLACEMENTS['top-feed'].slot} 
 *   format={AD_PLACEMENTS['top-feed'].format}
 * />
 */
export const AdSense = ({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  className = '' 
}: AdSenseProps) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [slot]);

  return (
    <div className={`adsense-wrapper ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          margin: '16px 0',
        }}
        data-ad-client="ca-pub-8811042531419271"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

export default AdSense;
