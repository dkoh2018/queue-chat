import dynamic from 'next/dynamic';

export const AsyncMessageQueueView = dynamic(
  () => import('./MessageQueueView').then(mod => ({ default: mod.MessageQueueView })),
  { ssr: false }
);