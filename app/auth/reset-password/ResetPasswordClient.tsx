'use client';

import { useSearchParams } from 'next/navigation';
import ResetPasswordFlow from './ResetPasswordFlow';

const ResetPasswordClient = () => {
  const searchParams = useSearchParams();

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  return (
    <ResetPasswordFlow
      accessToken={accessToken}
      refreshToken={refreshToken}
    />
  );
};

export default ResetPasswordClient;
