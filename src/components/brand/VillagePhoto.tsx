import { useState } from 'react'
import type { Village } from '@/types'
import { cn } from '@/utils/cn'
import { VillageArt } from './VillageArt'

/**
 * A village cover photo. A village without a photo of its own, or whose image cannot be loaded (offline,
 * blocked), shows its generated landscape illustration: never a stock photo of somewhere else.
 */
export function VillagePhoto({
  village,
  src,
  alt,
  className,
  imgClassName,
  eager,
}: {
  village: Pick<Village, 'id' | 'art'> & Partial<Pick<Village, 'coverImage'>>
  src?: string
  alt: string
  className?: string
  imgClassName?: string
  eager?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const url = src ?? village.coverImage
  return (
    <div className={cn('overflow-hidden bg-mint', className)}>
      {failed || !url ? (
        <VillageArt seed={village.id} scene={village.art.scene} palette={village.art.palette} label={alt} />
      ) : (
        <img
          src={url}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      )}
    </div>
  )
}
