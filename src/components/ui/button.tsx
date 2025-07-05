import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	className?: string;
}

export const Button = ({ children, className = '', ...props }: ButtonProps) => (
	<button
		className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow ${className}`}
		{...props}
	>
		{children}
	</button>
);
