import { createClient } from '@base44/sdk';

export const base44 = createClient({ 
  appId: '69a99628831bf76209f4646d'
});

export const auth = base44.auth;
