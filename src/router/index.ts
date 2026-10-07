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
    component: LibraryPage
  },
  {
    path: '/documentos/:id',
    name: 'DocumentDetails',
    component: DocumentDetailsPage
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
    component: CommunityGuidelines
  },
  {
    path: '/contact',
    name: 'Contact',
    component: AboutUsPage
  },
  {
    path: '/terms',
    name: 'Terms',
    component: AboutUsPage
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: AboutUsPage
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
  if (!to.meta.requiresAuth) return true;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return true;

  return {
    name: 'Auth',
    query: { redirect: to.fullPath }
  };
});

export default router
