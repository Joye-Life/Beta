"use client";

import { useEffect, useState } from "react";

export function LocalGreeting({ name }: { name?: string }) {
  const [greeting, setGreeting] = useState(`Hello${name ? `, ${name}` : ""}.`);

  useEffect(() => {
    const hour = new Date().getHours();
    const daypart = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    setGreeting(`Good ${daypart}${name ? `, ${name}` : ""}.`);
  }, [name]);

  return <>{greeting}</>;
}
