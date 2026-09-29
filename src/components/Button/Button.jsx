import { forwardRef } from 'react';
import { cx } from '../../lib/cx.js';
import styles from './Button.module.css';

/**
 * Buttons from the mockups: `secondary` (white, outlined), `dark` (pill, used for Ask Varsha)
 * and `icon` (square, grey; always pass an aria-label).
 */
const Button = forwardRef(function Button({ variant = 'secondary', type = 'button', className, ...props }, ref) {
  return <button ref={ref} type={type} className={cx(styles.button, styles[variant], className)} {...props} />;
});

export default Button;
