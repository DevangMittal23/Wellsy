"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  children?: React.ReactNode;
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  children,
}: InfiniteScrollProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  return (
    <>
      {children}
      <div ref={ref} className="h-4 w-full" />
    </>
  );
}
