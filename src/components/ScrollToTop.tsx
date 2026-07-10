import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** 탭·링크 이동 시 스크롤을 페이지 최상단으로 */
export function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    scrollToTop();
  }, [location.pathname, location.search, location.key]);

  return null;
}
