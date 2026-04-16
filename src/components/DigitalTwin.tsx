import { useRef, useEffect, useCallback } from "react";

interface DigitalTwinProps {
  onOrganFocus?: (organ: string) => void;
  selectedOrgan?: string | null;
  weight?: number;
}

const DigitalTwin = ({ selectedOrgan, weight = 0 }: DigitalTwinProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const focusOrgan = useCallback((organName: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    
    const win = iframe.contentWindow as any;
    
    // Call the robust focusing API explicitly exposed by the 3D viewer
    if (win && typeof win.focusOnOrganByName === 'function') {
      win.focusOnOrganByName(organName);
    } else {
      console.warn("DigitalTwin: focusOnOrganByName is not ready yet.");
    }
  }, []);

  const resetView = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const win = iframe.contentWindow as any;
    if (typeof win.returnToNormalView === 'function') {
      win.returnToNormalView();
    }
  }, []);

  useEffect(() => {
    if (selectedOrgan) {
      // Small delay to ensure iframe is ready
      const timer = setTimeout(() => focusOrgan(selectedOrgan), 300);
      return () => clearTimeout(timer);
    } else {
      resetView();
    }
  }, [selectedOrgan, focusOrgan, resetView]);

  // Handle dynamic weight changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const win = iframe.contentWindow as any;

    // Check if the setWeight API is ready yet. 
    // We add a small timeout or repetitive check to ensure it applies even if loaded dynamically.
    const applyWeight = () => {
      if (typeof win.setWeight === 'function') {
        win.setWeight(weight);
      }
    };
    
    applyWeight();
    // In case iframe hasn't fully attached setWeight yet:
    const timer = setTimeout(applyWeight, 500);
    return () => clearTimeout(timer);
  }, [weight]);

  return (
    <iframe
      ref={iframeRef}
      src="/twin/index.html"
      className="w-full h-full border-0"
      style={{ background: "transparent" }}
      title="Digital Twin"
    />
  );
};

export default DigitalTwin;
