"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WalletGate from "@/app/dashboard/WalletGate";
import DashboardContent from "@/app/dashboard/DashboardContent";

export default function OraclePage() {
  const { id } = useParams<{ id: string }>();
  const [wallet,  setWallet]  = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { if (data.authenticated) setWallet(data.wallet); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (wallet) return <DashboardContent wallet={wallet} initialOracleId={id} />;
  return <WalletGate onAuth={setWallet} showCard={checked} />;
}
