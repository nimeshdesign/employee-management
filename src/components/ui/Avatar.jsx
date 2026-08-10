const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Falls back to initials-on-a-circle when there's no image — common
// pattern so the UI never shows a broken image icon.
function Avatar({ src, name = '', size = 'md' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${SIZES[size]}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-primary font-medium text-white ${SIZES[size]}`}
    >
      {getInitials(name)}
    </span>
  )
}

export default Avatar
