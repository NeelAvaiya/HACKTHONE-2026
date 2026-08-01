// Circular avatar. Default is the generic silhouette placeholder — a grey figure on the
// person's colour, with a long/short hair variant. If a name (or the src prop) points at a
// real picture, that is shown instead; a picture that fails to load falls back to the silhouette.
import { useEffect, useId, useState } from 'react'
import { avatarFor, colorFor, hairFor } from '../../data/avatars.js'

const FIGURE = '#9d9d9d'
const FACE = '#efefef'

// Silhouette geometry, drawn in a 100x100 box and clipped to the circle.
// Hair sits behind the face ellipse, so it reads as a frame around it.
const HAIR = {
  short: 'M50 14c-15 0-25 11-25 26s10 26 25 26 25-11 25-26-10-26-25-26z',
  long:
    'M23 42c0-16 12-28 27-28s27 12 27 28c0 12-1 25-3 33-1 5-7 5-8 0-1-6-1-15-1-22H35c0 7 0 16-1 22-1 5-7 5-8 0-2-8-3-21-3-33z',
}
const BODY = 'M50 60c-21 0-37 16-40 42h80c-3-26-19-42-40-42z'

export default function Avatar({ name = '', src, size = 44, className = '' }) {
  const url = src ?? avatarFor(name)
  const [failed, setFailed] = useState(false)
  const clipId = `avatar-clip-${useId()}` // unique per instance — a shared id breaks if the first avatar unmounts

  useEffect(() => setFailed(false), [url])

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full bg-white object-cover ${className}`}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={name}
      className={`shrink-0 rounded-full ${className}`}
    >
      <circle cx="50" cy="50" r="50" fill={colorFor(name)} />
      <g clipPath={`url(#${clipId})`} fill={FIGURE}>
        <path d={HAIR[hairFor(name)] || HAIR.short} />
        <path d={BODY} />
      </g>
      <ellipse cx="50" cy="42" rx="17" ry="20" fill={FACE} />
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
    </svg>
  )
}
