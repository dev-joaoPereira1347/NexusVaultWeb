import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '@/views/HomePage.vue'
import LibraryPage from '@/views/LibraryPage.vue'
import UploadPage from '@/views/UploadPage.vue'
import CommunityGuidelines from '@/views/CommunityGuidelinesPage.vue'
import AuthPage from '@/views/AuthPage.vue';
import AboutUsPage from '@/views/AboutUs.vue';
import UserAreaPage from '@/views/UserAreaPage.vue';
import DocumentDetailsPage from '@/views/DocumentDetailsPage.vue';
import PublicProfilePage from '@/views/PublicProfilePage.vue';
import GenresPage from '@/views/GenresPage.vue';
import AdminReportsPage from '@/views/AdminReportsPage.vue';
import AdminContentPage from '@/views/AdminContentPage.vue';
import TermsOfUsePage from '@/views/TermsOfUsePage.vue';
import PrivacyPolicyPage from '@/views/PrivacyPolicyPage.vue';
import HelpPage from '@/views/HelpPage.vue';
import { supabase } from '@/services/supabase';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/upload',
    name: 'Upload',
    component: UploadPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/generos',
    name: 'Generos',
    component: GenresPage
  },
  {
    path: '/search',
    name: 'Search',
    component: LibraryPage
  },
  {
    path: '/documentos/:id',
    name: 'DocumentDetails',
    component: DocumentDetailsPage
  },
  {
    path: '/colaborador/:id',
    name: 'PublicProfile',
    component: PublicProfilePage
  },
  {
    path: '/genres',
    name: 'Genres',
    redirect: '/generos'
  },
  {
    path: "/community-guidelines",
    name: 'CommunityGuidelines',
    component: CommunityGuidelines
  },
  {
    path: "/about-us",
    name: "AboutUs",
    component: AboutUsPage
  },
  {
    path: '/help',
    name: 'Help',
    component: HelpPage
  },
  {
    path: '/contact',
    name: 'Contact',
    component: AboutUsPage
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsOfUsePage
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: PrivacyPolicyPage
  },
  {
    path: "/auth",
    name: "Auth",
    component: AuthPage
  },
  {
    path: "/profile",
    name: "Profile",
    component: UserAreaPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/denuncias',
    name: 'AdminReports',
    component: AdminReportsPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/gestao',
    name: 'AdminContent',
    component: AdminContentPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: AuthPage
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.requiresAdmin) return true;

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      name: 'Auth',
      query: { redirect: to.fullPath }
    };
  }

  if (to.meta.requiresAdmin && user.app_metadata.role !== 'admin') return { name: 'Home' };
  return true;
});

export default router
