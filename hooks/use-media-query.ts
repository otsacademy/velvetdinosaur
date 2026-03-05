"use client";

import * as React from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const update = () => setValue(mediaQueryList.matches);

    update();
    mediaQueryList.addEventListener("change", update);
    return () => mediaQueryList.removeEventListener("change", update);
  }, [query]);

  return value;
}
