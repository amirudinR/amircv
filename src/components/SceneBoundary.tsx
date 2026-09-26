import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SceneBoundaryProps {
  children: ReactNode;
  /** Rendered in place of the scene once it has failed. */
  fallback: ReactNode;
  /** Notified once, when the boundary catches. */
  onError?: (error: Error) => void;
}

interface SceneBoundaryState {
  failed: boolean;
}

/**
 * Catches runtime WebGL failures that R3F's `fallback` prop cannot: a context
 * that is created successfully and then lost to a driver crash or GPU reset.
 *
 * Class component on purpose — `componentDidCatch` is the only way to trap a
 * render error without pulling in an error-boundary dependency.
 */
export class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  override state: SceneBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('[HeroScene] falling back to static artwork:', error.message, info.componentStack);
    this.props.onError?.(error);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
