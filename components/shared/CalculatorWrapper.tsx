'use client';

import dynamic from 'next/dynamic';

const DynamicCalculator = dynamic(() => import('./CalculatorWidget'), {
    ssr: false,
});

export function CalculatorWrapper() {
    return <DynamicCalculator />;
}
