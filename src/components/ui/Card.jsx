// `children` is a special prop — it's whatever JSX the parent puts between
// the opening/closing tags. This is composition: Card doesn't know what
// goes inside it, it just provides the rounded/shadow container.
function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 ${className}`}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      )}
      {children}
    </div>
  )
}

export default Card
