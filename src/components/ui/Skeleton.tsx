import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
}

export default function Skeleton({
    width,
    height,
    borderRadius,
    className = "",
    style,
    ...props
}: SkeletonProps) {
    const styles: React.CSSProperties = {
        width: width,
        height: height,
        borderRadius: borderRadius,
        ...style,
    };

    return (
        <div
            className={`skeleton ${className}`}
            style={styles}
            {...props}
        />
    );
}
