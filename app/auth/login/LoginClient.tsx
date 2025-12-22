'use client';

import { useSearchParams } from 'next/navigation';
import LoginForm from './LoginForm'; // ✅ import default

const LoginClient = () => {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  return <LoginForm redirect={redirect} />;
};

export default LoginClient;
