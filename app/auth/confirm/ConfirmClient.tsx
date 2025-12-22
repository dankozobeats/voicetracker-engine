'use client';

import { useSearchParams } from 'next/navigation';
import ConfirmFlow from './ConfirmFlow';

const ConfirmClient = () => {
  const searchParams = useSearchParams();

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  return (
    <ConfirmFlow
      accessToken={accessToken}
      refreshToken={refreshToken}
    />
  );
};

export default ConfirmClient;
