import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LazyWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

export default LazyWrapper;