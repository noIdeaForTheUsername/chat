import { Routes } from '@angular/router';
import { loadingPageGuard } from './loading/loading-page.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./loading/loading-page/loading.page').then(m => m.LoadingPage),
    canActivate: [loadingPageGuard]
  },
  {
    path: 'chats',
    loadComponent: () => import('./conversations/conversations-page/conversations.page').then((m) => m.ConversationsPage),
  },
  {
    path: 'discovery',
    loadComponent: () => import('./profiles/discovery-page/discovery.page').then( m => m.DiscoveryPage)
  },
  {
    path: 'chats/:id',
    loadComponent: () => import('./messages/chat-page/chat.page').then( m => m.ChatPage)
  },
  {
    path: 'profiles/:id',
    loadComponent: () => import('./profiles/profile-page/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'profiles/:id/security-verification',
    loadComponent: () => import('./profiles/security-verification-page/security-verification.page').then( m => m.SecurityVerificationPage)
  },
  {
    path: 'chats/:id/options',
    loadComponent: () => import('./conversations/conversation-settings-page/conversation-settings.page').then( m => m.ConversationSettingsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/app-settings/app-settings.page').then( m => m.AppSettingsPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login-page/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register-page/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'settings/account',
    loadComponent: () => import('./settings/account-settings/account-settings.page').then( m => m.AccountSettingsPage)
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcoming/welcome/welcome.page').then( m => m.WelcomePage)
  },
  {
    path: 'account-inactive',
    loadComponent: () => import('./welcoming/account-inactive/account-inactive.page').then( m => m.AccountInactivePage)
  },
  {
    path: 'installation-guide',
    loadComponent: () => import('./welcoming/guide/guide.page').then( m => m.GuidePage)
  },
];
