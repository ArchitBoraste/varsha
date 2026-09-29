import { useEffect } from 'react';
import { cx } from '../../lib/cx.js';
import TopBar from '../TopBar/TopBar.jsx';
import styles from './Page.module.css';

/** A screen: the top bar plus a scrolling content area laid out by `className`. */
export default function Page({ title, subtitle, breadcrumb, controls, className, children }) {
  useEffect(() => {
    document.title = `${title} · Varsha`;
  }, [title]);

  return (
    <>
      <TopBar title={title} subtitle={subtitle} breadcrumb={breadcrumb} controls={controls} />
      <div className={cx(styles.body, className)}>{children}</div>
    </>
  );
}
