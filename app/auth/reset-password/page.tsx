import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordClient />
    </Suspense>
  );
};

export default ResetPasswordPage;
