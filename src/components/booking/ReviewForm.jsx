// Post-meeting review form: 3 option questions + 5-star overall rating (props-only)
import { useState } from 'react'
import { Star } from 'lucide-react'
import Card from '../common/Card.jsx'

// className lets the caller widen the form: it renders in a chat bubble on one
// side and on a full page on the other.
export default function ReviewForm({ questions, options, starsLabel, submitLabel, onSubmit, className = 'max-w-sm p-4' }) {
  const [answers, setAnswers] = useState({})
  const [stars, setStars] = useState(0)
  const complete = stars > 0 && questions.every((q) => answers[q.key])

  return (
    <Card className={className}>
      {questions.map((q) => (
        <div key={q.key} className="mb-3">
          <p className="text-xs font-semibold text-slate-700">{q.label}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [q.key]: opt })}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors ${
                  answers[q.key] === opt
                    ? 'bg-blue-600 text-white ring-blue-600'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs font-semibold text-slate-700">{starsLabel}</p>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
            <Star
              size={22}
              className={n <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
            />
          </button>
        ))}
      </div>

      <button
        disabled={!complete}
        onClick={() => onSubmit({ answers, stars })}
        className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </Card>
  )
}
