import { forwardRef } from 'react';
import { buttonClass } from './buttonClass.js';

/**
 * A button in one of the mockups' styles (see buttonClass). Icon-only (`square`) buttons need
 * an aria-label. Use aria-disabled rather than disabled so the button keeps its tooltip and
 * stays focusable; clicks are then ignored.
 */
const Button = forwardRef(function Button({ variant, square, className, type = 'button', onClick, ...props }, ref) {
  const inactive = props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, square, className })}
      onClick={inactive ? undefined : onClick}
      {...props}
    />
  );
});

export default Button;
