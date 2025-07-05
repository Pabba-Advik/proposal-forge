import React from 'react';

interface CardProps {
	children: React.ReactNode;
	className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => (
	<div
		className={`bg-white dark:bg-gray-900 border rounded-2xl shadow p-4 ${className}`}
	>
		{children}
	</div>
);

interface CardHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => (
	<div className={`text-xl font-bold mb-2 ${className}`}>{children}</div>
);

interface CardContentProps {
	children: React.ReactNode;
	className?: string;
}

export const CardContent = ({ children, className = '' }: CardContentProps) => (
	<div className={`text-gray-800 dark:text-gray-100 ${className}`}>
		{children}
	</div>
);
