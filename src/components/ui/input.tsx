import React from 'react';

export const Input = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
	<input
		ref={ref}
		className={`border px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
		{...props}
	/>
));
