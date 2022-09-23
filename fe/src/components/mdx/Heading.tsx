import React from 'react';

function getAnchor(text: string) {
	return text

		.toLowerCase()

		.replace(/[^a-z0-9 ]/g, "")

		.replace(/[ ]/g, "-");
}

interface HeadingProps {
	children: React.ReactNode;
}

export function H2(props?: HeadingProps) {
	const anchor = getAnchor(props?.children?.toString() || "");

	const link = `#${anchor}`;

	return (
		<h2 id={anchor}>
			{props?.children}
		</h2>
	);
}

export function H3(props?: HeadingProps) {
	const anchor = getAnchor(props?.children?.toString() || "");

	const link = `#${anchor}`;

	return (
		<h3 id={anchor}>
			{props?.children}
		</h3>
	);
}
