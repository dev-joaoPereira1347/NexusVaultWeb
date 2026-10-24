import { mount } from '@vue/test-utils'
import HomePage from '@/views/HomePage.vue'
import UploadMetadataForm from '@/components/UploadMetadataForm.vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { signInWithOtpMock, resetPasswordForEmailMock, updateUserMock, profilesUpsertMock, getSessionMock } = vi.hoisted(() => ({
  signInWithOtpMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
  updateUserMock: vi.fn(),
  profilesUpsertMock: vi.fn(),
  getSessionMock: vi.fn(),
}))

vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: signInWithOtpMock,
      verifyOtp: vi.fn(),
      getSession: getSessionMock.mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: profilesUpsertMock,
    })),
  },
}))

const { saveProfile, sendMagicLink, requestPasswordReset } = await import('@/services/authService')

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
    signInWithOtpMock.mockReset()
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

  test('sends password reset email with a valid redirect URL', async () => {
    await requestPasswordReset('user@example.com')

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith('user@example.com', {
      redirectTo: expect.stringContaining('/reset-password'),
    })
  })
})
