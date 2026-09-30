import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

/** Catches a screen's render errors and offers a reload instead of a blank page. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className={styles.box}>
        <p className={styles.title}>This screen hit a problem</p>
        <p className={styles.text}>Your overrides and alert decisions are saved. Reload to continue.</p>
        <button type="button" className={styles.button} onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
