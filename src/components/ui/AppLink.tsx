import { Link, type LinkProps } from "react-router-dom";
import { scrollToTop } from "@/components/ScrollToTop";

/** 내부 이동 시 항상 페이지 최상단부터 */
export function AppLink({ onClick, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        scrollToTop();
        onClick?.(e);
      }}
    />
  );
}
