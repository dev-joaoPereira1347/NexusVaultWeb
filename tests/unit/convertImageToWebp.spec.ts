import { describe, expect, test, vi } from 'vitest'
import { convertImageToWebp } from '@/utils/convertImageToWebp'

describe('convertImageToWebp', () => {
  test('converts an image file to webp', async () => {
    const close = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 800,
      height: 400,
      close
    }))

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn()
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext

    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback: BlobCallback) {
      callback(new Blob(['webp'], { type: 'image/webp' }))
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob

    const file = new File(['png'], 'avatar.png', { type: 'image/png' })
    const result = await convertImageToWebp(file)

    expect(result.type).toBe('image/webp')
    expect(result.name).toBe('avatar.webp')
    expect(close).toHaveBeenCalled()
  })
})
