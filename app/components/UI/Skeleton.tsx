function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    const combinedClass = "animate-pulse rounded-md bg-muted" + (className ? " " + className : "");
    return (
        <div
            className={combinedClass}
            {...props}
        />
    )
}

export { Skeleton }
