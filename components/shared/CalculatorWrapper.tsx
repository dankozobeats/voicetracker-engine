'use client';

import dynamic from 'next/dynamic';

const DynamicToolbar = dynamic(() => import('./FloatingToolbar'), {
    ssr: false,
});

export function CalculatorWrapper() {
    return <DynamicToolbar />;
}
