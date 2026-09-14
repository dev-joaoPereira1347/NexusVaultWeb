import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '@/views/HomePage.vue'
import UploadPage from '@/views/UploadPage.vue'
import CommunityGuidelines from '@/views/CommunityGuidelinesPage.vue'
import AuthPage from '@/views/AuthPage.vue';

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
    component: UploadPage
  },
  {
    path: "/community-guidelines",
    name: 'CommunityGuidelines',
    component: CommunityGuidelines
  },
  {
    path: "/auth",
    name: "Auth",
    component: AuthPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
