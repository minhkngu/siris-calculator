import { Component, Suspense, useLayoutEffect, type ReactNode } from 'react';

export function FeatureLoading() {
  return <div role="status" aria-live="polite" className="min-h-48 rounded-2xl bg-white/80 p-6 text-slate-500">Đang tải...</div>;
}

function ReadyContent({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  useLayoutEffect(() => { onReady?.(); }, [onReady]);
  return children;
}

export class FeatureBoundary extends Component<{ children: ReactNode; onReady?: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return (
      <div role="alert" className="rounded-2xl bg-white p-6">
        <p>Không tải được giao diện. Vui lòng tải lại trang.</p>
        <button className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-white" onClick={() => window.location.reload()}>Tải lại trang</button>
      </div>
    );
    return <Suspense fallback={<FeatureLoading />}><ReadyContent onReady={this.props.onReady}>{this.props.children}</ReadyContent></Suspense>;
  }
}
