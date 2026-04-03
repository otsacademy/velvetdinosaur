import * as React from "react";

export function ImageIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M9 6v3H8v1H5V9H4V6h1V5h3v1z"/><path d="M22 2V1H2v1H1v20h1v1h20v-1h1V2zm-5 12v1h1v1h1v1h1v1h1v3H8v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v1zm3 1v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1H9v1H8v1H7v-1H6v-1H5v-1H4v-1H3V3h18v12zM5 18v1h1v1h1v1H3v-4h1v1z"/>
    </svg>
  );
}
