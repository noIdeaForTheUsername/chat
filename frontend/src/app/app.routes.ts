import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'chats',
    pathMatch: 'full',
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
];
