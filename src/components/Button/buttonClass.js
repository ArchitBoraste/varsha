import { cx } from '../../lib/cx.js';
import styles from './Button.module.css';

/**
 * Class names for the mockups' buttons. `variant`: secondary (white, outlined), primary (blue),
 * dark (pill, for Ask Varsha) or ghost (grey). `square` makes an icon-only button.
 */
export const buttonClass = ({ variant = 'secondary', square = false, className }) =>
  cx(styles.button, styles[variant], square && styles.square, className);
