import { Suspense } from 'react';
import ConfirmClient from './ConfirmClient';

const ConfirmPage = () => {
  return (
    <Suspense fallback={<div />}>
      <ConfirmClient />
    </Suspense>
  );
};

export default ConfirmPage;
