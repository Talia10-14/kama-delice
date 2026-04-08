'use client';

import { Suspense } from 'react';
import { LoginForm } from './form';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
