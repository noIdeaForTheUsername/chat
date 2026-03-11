import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./onboarding/welcome/welcome.page').then( m => m.WelcomePage),
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
    path: 'account-inactive',
    loadComponent: () => import('./onboarding/account-inactive/account-inactive.page').then( m => m.AccountInactivePage)
  },
  {
    path: 'installation-guide',
    loadComponent: () => import('./onboarding/pwa-guide/pwa-guide.page').then( m => m.GuidePage)
  },
  {
    path: 'android-installation',
    loadComponent: () => import('./onboarding/android-installation/android-installation.page').then( m => m.AndroidInstallationPage)
  },
];
