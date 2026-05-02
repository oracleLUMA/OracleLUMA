interface Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    signMessage?: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
    signTransaction?: <T>(tx: T) => Promise<T>;
  };
}
