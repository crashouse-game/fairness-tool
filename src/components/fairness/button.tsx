import * as React from "react";
import { TailSpin } from "react-loader-spinner";

const containerStyle =
	"rounded-xl bg-gradient-to-b from-purple to-purple-800 p-[1px] transition-all duration-300 ease-out  hover:to-bitrush-purple-800";

const buttonStyle = [
	"m-[1px] inline-flex items-center justify-center whitespace-nowrap rounded-[10px] px-8 p-xs max-h-10",
	"shadow-[inset_0_1px_10px_rgba(120,80,210,0),inset_0_1px_10px_rgba(100,80,210,0.9)]",
	"font-sm",
	"enabled:bg-primary-button enabled:active:bg-primary-button enabled:hover:bg-primary-button-hover",
	"enabled:hover:shadow-[inset_0_1px_15px_rgba(120,80,210,0),inset_0_1px_15px_rgba(100,80,210,0.8)]",
	"disabled:bg-[#221A4A] disabled:pointer-events-none disabled:text-bitrush-text-secondary",
	"ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
].join(" ");

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, isLoading = false, disabled = false, type = "button", children, ...props },
		ref,
	) => (
		<div className={`${containerStyle}${disabled || isLoading ? "opacity-60" : ""}`}>
			<button
				ref={ref}
				type={type}
				className={`${buttonStyle}${className ? ` ${className}` : ""}`}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<TailSpin
						visible={true}
						height="24"
						width="24"
						strokeWidth={3}
						color="#ffffff"
						ariaLabel="tail-spin-loading"
						radius={1}
					/>
				) : (
					children
				)}
			</button>
		</div>
	),
);

Button.displayName = "Button";

export { Button };
