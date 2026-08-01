// Compact display of one submitted review (stars + answers), or a waiting note (props-only)
import { botScripts } from '../../data/botScripts.js'

const starsOf = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function ReviewBlock({ title, review, waitingText }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      {review ? (
        <>
          <p className="mt-1 text-base text-amber-500">
            {starsOf(review.stars)} <span className="text-xs text-slate-500">({review.stars}/5)</span>
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
            {botScripts.reviewQuestions.map((q) => (
              <li key={q.key}>
                {q.label} <strong>{review.answers[q.key]}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-xs text-slate-400">{waitingText}</p>
      )}
    </div>
  )
}
