"use client";

import { useEffect } from "react";
import { endAnalyticsSession, startAnalyticsSession } from "../data/analytics-events";

export default function AnalyticsSession() {
  useEffect(() => {
    startAnalyticsSession();

    const handlePageHide = () => {
      endAnalyticsSession({ exitPath: window.location.pathname });
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  return null;
}
