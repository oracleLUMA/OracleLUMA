"use client";

import { useEffect, useState } from "react";
import WalletGate from "./WalletGate";
import DashboardContent from "./DashboardContent";

export default function Dashboard() {
  const [wallet, setWallet]   = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { if (data.authenticated) setWallet(data.wallet); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (wallet) return <DashboardContent wallet={wallet} />;
  return <WalletGate onAuth={setWallet} showCard={checked} />;
}
