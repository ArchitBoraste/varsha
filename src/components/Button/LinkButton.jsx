import { Link } from 'react-router';
import { buttonClass } from './buttonClass.js';

/** A router link styled as a Button (same `variant` and `square` options). */
export default function LinkButton({ variant, square, className, ...props }) {
  return <Link className={buttonClass({ variant, square, className })} {...props} />;
}
