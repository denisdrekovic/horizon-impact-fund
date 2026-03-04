"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvestmentIndexPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/investments/${params.id}/overview`);
  }, [params.id, router]);

  return null;
}
