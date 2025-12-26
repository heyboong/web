import { useState, useEffect } from 'react';

export const useBalance = () => {
  const [balance] = useState(0);
  const [isLoading] = useState(false);

  // Topup/billing balance API has been removed; keep a static 0 balance
  useEffect(() => {}, []);

  return { balance, isLoading };
};
