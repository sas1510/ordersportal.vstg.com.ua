import { Component, useEffect } from 'react';

export function ApplicationReady() {
  useEffect(() => {
    window.dispatchEvent(new Event('portal:ready'));
  }, []);
  return null;
}

export default class ApplicationBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // The HTML fallback survives even when the React tree cannot render.
    window.dispatchEvent(new Event('portal:startup-failed'));
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
