import { Component, Suspense, useLayoutEffect, type ReactNode } from 'react';

export function FeatureLoading() {
  return null;
}

function ReadyContent({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  useLayoutEffect(() => {
    onReady?.();
  }, [onReady]);
  return children;
}

export class FeatureBoundary extends Component<
  { children: ReactNode; onReady?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return (
        <div role="alert" className="rounded-xl bg-white border border-slate-200 p-6 text-center shadow-sm">
          <p className="text-xs sm:text-sm text-slate-600 mb-3">
            Không tải được giao diện. Vui lòng thử lại.
          </p>
          <button
            type="button"
            className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 transition-colors shadow-sm cursor-pointer"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      );
    return (
      <Suspense fallback={<FeatureLoading />}>
        <ReadyContent onReady={this.props.onReady}>{this.props.children}</ReadyContent>
      </Suspense>
    );
  }
}
