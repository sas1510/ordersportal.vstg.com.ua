import { Component, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import './RouteContent.css';

class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previousProps) {
    if (this.state.failed && previousProps.path !== this.props.path) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return <div className="route-content-status" role="alert">
        <p>Не вдалося завантажити сторінку. Перевірте з’єднання та оновіть сторінку.</p>
        <button type="button" onClick={() => window.location.reload()}>Оновити сторінку</button>
      </div>;
    }
    return this.props.children;
  }
}

export default function RouteContent() {
  const { pathname } = useLocation();
  return <PageErrorBoundary path={pathname}>
    <Suspense fallback={<div className="route-content-status" role="status" aria-live="polite">
      <span className="route-content-spinner" aria-hidden="true" />
      <span>Завантаження сторінки…</span>
    </div>}>
      <Outlet />
    </Suspense>
  </PageErrorBoundary>;
}
