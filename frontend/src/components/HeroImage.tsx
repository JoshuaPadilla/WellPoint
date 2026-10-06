// Hero image slot. To use your own photo, put it in `public/` and set HERO_IMAGE,
// e.g. '/catbalogan-overlook.jpg'. Leave it empty to show the empty placeholder.
const HERO_IMAGE = '/bggg.webp'
const HERO_ALT = ''
const HERO_FOCUS = 'center' // which part to keep when cropping, e.g. 'center 30%' or 'left center'

type Props = { src?: string; alt?: string; focus?: string }

export function HeroImage({ src = HERO_IMAGE, alt = HERO_ALT, focus = HERO_FOCUS }: Props) {
  // The frame size is fixed by aspect ratio, so swapping the image never changes the layout.
  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-md">
      <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-[4/5] ${src ? 'shadow-2xl shadow-well/25' : ''}`}>
        {src ? (
          <img src={src} alt={alt} style={{ objectPosition: focus }} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            role="img"
            aria-label="Hero image placeholder"
            className="absolute inset-0 grid place-items-center rounded-3xl border-2 border-dashed border-well/30 p-6 text-center text-sm text-ink/50"
          >
            Hero image goes here
          </div>
        )}
      </div>
    </div>
  )
}
