import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 1024;

const useIsMobile = () => {
 
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {

    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    const handler = (event) => {
   
      setIsMobile(event.matches);
    };


    mediaQuery.addListener(handler);

   
    setIsMobile(mediaQuery.matches);

    return () => {
      mediaQuery.removeListener(handler);
    };
  }, []);

  return isMobile;
};

export default useIsMobile;
