import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { imageFileToDataUrl } from '@/utils/image'

/**
 * Drag-and-drop area for a single image. The chosen picture is resized in the
 * browser and handed back as a data URL, so it can be stored with the record.
 */
export function ImageDrop({
  value,
  onChange,
  label,
  hint,
  maxSize,
  className,
  aspect = 'aspect-[16/9]',
}: {
  value?: string
  onChange: (dataUrl: string) => void
  label: string
  hint?: string
  maxSize?: number
  className?: string
  aspect?: string
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('Choose an image file (JPG, PNG, WebP…)', 'اختر ملف صورة (JPG أو PNG أو WebP…)'))
      return
    }
    setError('')
    setBusy(true)
    try {
      onChange(await imageFileToDataUrl(file, maxSize))
    } catch {
      setError(t('This image could not be read. Try another file.', 'تعذّرت قراءة هذه الصورة. جرّب ملفًا آخر.'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void pick(e.dataTransfer.files)
  }
  const dragProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault()
      setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop,
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-sm font-medium text-ink">{label}</p>
      {value ? (
        <div {...dragProps} className={cn('group relative overflow-hidden rounded-2xl border bg-white', dragging ? 'border-olive-400 ring-4 ring-olive-100' : 'border-stone-line', aspect)}>
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/55 to-transparent p-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-ink shadow transition hover:bg-white">
              {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <RefreshCw className="size-3.5" aria-hidden />}
              {t('Replace', 'استبدال')}
            </button>
            <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-accent-dark shadow transition hover:bg-white">
              <Trash2 className="size-3.5" aria-hidden />
              {t('Remove', 'إزالة')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          {...dragProps}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition',
            dragging ? 'border-olive-400 bg-olive-50' : 'border-stone-line bg-beige/50 hover:border-olive-300 hover:bg-beige',
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-olive shadow-soft">
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
          </span>
          <span className="text-sm font-medium text-ink">{t('Drop an image here or click to browse', 'اسحب صورة إلى هنا أو انقر للاختيار')}</span>
          {hint && <span className="text-xs text-muted">{hint}</span>}
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void pick(e.target.files)} tabIndex={-1} aria-hidden />
    </div>
  )
}
