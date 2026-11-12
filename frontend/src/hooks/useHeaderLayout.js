import { useRef } from 'react';
import { useMediaQuery } from 'react-responsive';

// Desktop navigation remains open; only the existing mobile breakpoint collapses it.
export default function useHeaderLayout() {
  const headerRef = useRef(null);
  const isMobile = useMediaQuery({ maxWidth: 1223 });
  return { headerRef, isMobile };
}
