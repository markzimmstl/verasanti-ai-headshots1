import { createClient } from '@base44/sdk';

export const base44 = createClient({ 
  appId: '69a8dfde570848365d594a26'
});

export const auth = base44.auth;
