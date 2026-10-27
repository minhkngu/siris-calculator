import { useCallback, useState } from 'react';
import { LazyMotion, m, type HTMLMotionProps } from 'motion/react';

// Mounted only for an open panel, so animation features are off the initial path.
export function AnimatedPanel(props: HTMLMotionProps<'div'>) {
  const [failed, setFailed] = useState(false);
  const loadFeatures = useCallback(() => import('./motionFeatures')
    .then(module => module.default)
    .catch(() => {
      setFailed(true);
      // React renders the boundary; do not reject Motion's asynchronous effect.
      return new Promise<never>(() => {});
    }), []);
  if (failed) throw new Error('Không tải được hiệu ứng giao diện.');
  return <LazyMotion features={loadFeatures}><m.div {...props} /></LazyMotion>;
}
