import { mount } from '@vue/test-utils'
import HomePage from '@/views/HomePage.vue'
import UploadMetadataForm from '@/components/UploadMetadataForm.vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  signUpMock,
  signInWithOtpMock,
  resendMock,
  verifyOtpMock,
  resetPasswordForEmailMock,
  updateUserMock,
  profilesUpsertMock,
  getSessionMock,
} = vi.hoisted(() => ({
  signUpMock: vi.fn(),
  signInWithOtpMock: vi.fn(),
  resendMock: vi.fn(),
  verifyOtpMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
  updateUserMock: vi.fn(),
  profilesUpsertMock: vi.fn(),
  getSessionMock: vi.fn(),
}))

vi.mock('@/services/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    auth: {
      signInWithPassword: vi.fn(),
      signUp: signUpMock,
      signInWithOtp: signInWithOtpMock,
      resend: resendMock,
      verifyOtp: verifyOtpMock,
      getSession: getSessionMock.mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/avatar.webp' } }),
      })),
    },
    from: vi.fn(() => ({
      upsert: profilesUpsertMock,
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { username: 'test_user', avatar_url: null }, error: null }),
    })),
  },
}))

const {
  saveProfile,
  signUp,
  sendMagicLink,
  resendSignupConfirmation,
  verifySignupOtp,
  requestPasswordReset,
  savePendingAvatar,
  checkAndSyncPendingAvatar,
} = await import('@/services/authService')

describe('HomePage.vue', () => {
  test('renders the app landing page content', () => {
    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })
    expect(wrapper.text()).toContain('MUSEU DIGITAL')
    expect(wrapper.text()).toContain('Sua biblioteca digital colaborativa')
  })
})

describe('UploadMetadataForm.vue', () => {
  test('renders optional cover field', () => {
    const wrapper = mount(UploadMetadataForm, {
      props: {
        isValid: true,
        isUploading: false,
        modelValue: {
          title: 'Teste',
          author: 'Autor',
          category: 'literatura',
          year: '2024',
          type: 'livro',
          genre: 'Romance',
          language: 'pt',
          description: 'Descrição',
          cover: null,
          rightsDeclarationAccepted: false,
        },
        showRightsDeclaration: true,
      },
    })

    expect(wrapper.text()).toContain('Capa')
    expect(wrapper.text()).toContain('opcional')
    expect(wrapper.text()).toContain('domínio público')
    expect(wrapper.get('#year').attributes('required')).toBeDefined()
    expect(wrapper.get('#rights-declaration').attributes('required')).toBeDefined()
  })
})

describe('authService email redirects', () => {
  beforeEach(() => {
    signUpMock.mockReset()
    signInWithOtpMock.mockReset()
    resendMock.mockReset()
    verifyOtpMock.mockReset()
    resetPasswordForEmailMock.mockReset()
    updateUserMock.mockReset()
    profilesUpsertMock.mockReset()
    getSessionMock.mockReset()
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null })
  })

  test('skips profile creation when there is no active session after signup', async () => {
    const result = await saveProfile('user-123', {
      fullName: 'User Example',
      username: 'user_example',
      avatarUrl: '',
    })

    expect(result).toEqual({ error: null, skipped: true })
    expect(profilesUpsertMock).not.toHaveBeenCalled()
  })

  test('does not fail signup when there is no active session for profile persistence', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null })

    const result = await saveProfile('user-123', {
      fullName: 'User Example',
      username: 'user_example',
      avatarUrl: '',
    })

    expect(result).toEqual({ error: null, skipped: true })
    expect(profilesUpsertMock).not.toHaveBeenCalled()
  })

  test('sends magic link with a valid redirect URL', async () => {
    await sendMagicLink('user@example.com')

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/auth'),
      },
    })
  })

  test('sends signup confirmation with the auth page as redirect', async () => {
    await signUp({
      email: 'user@example.com',
      password: 'example-password',
      fullName: 'User Example',
      username: 'user_example',
    })

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'example-password',
      options: {
        emailRedirectTo: expect.stringContaining('/auth'),
        data: {
          full_name: 'User Example',
          username: 'user_example',
        },
      },
    })
  })

  test('resends signup confirmation with a valid redirect URL', async () => {
    await resendSignupConfirmation('user@example.com')

    expect(resendMock).toHaveBeenCalledWith({
      type: 'signup',
      email: 'user@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/auth'),
      },
    })
  })

  test('verifies signup using the email OTP', async () => {
    await verifySignupOtp('user@example.com', '123456')

    expect(verifyOtpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '123456',
      type: 'signup',
    })
  })

  test('sends password reset email with a valid redirect URL', async () => {
    await requestPasswordReset('user@example.com')

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith('user@example.com', {
      redirectTo: expect.stringContaining('/reset-password'),
    })
  })

  test('saves and syncs pending avatar after signup when session is established', async () => {
    const file = new File(['fake webp data'], 'avatar.webp', { type: 'image/webp' })
    await savePendingAvatar('user@example.com', 'user-123', 'User Example', 'user_example', file)

    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'user@example.com', user_metadata: {} },
        },
      },
      error: null,
    })

    const syncedUrl = await checkAndSyncPendingAvatar({ id: 'user-123', email: 'user@example.com' })
    expect(syncedUrl).toBe('https://example.com/avatar.webp')
    expect(profilesUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-123',
        username: 'user_example',
        avatar_url: 'https://example.com/avatar.webp',
      }),
      { onConflict: 'id' }
    )
  })
})
