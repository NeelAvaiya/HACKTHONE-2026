// Both sides' reviews, side by side (props-only). The same component reads
// correctly from either side: `side` decides which card is labelled "Your review".
import ReviewBlock from './ReviewBlock.jsx'

export default function ReviewSummary({ reviews = {}, side, clientName, expertName, waitingText }) {
  const cards = [
    { key: 'client', review: reviews.client, name: clientName },
    { key: 'support', review: reviews.support, name: expertName },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <ReviewBlock
          key={card.key}
          title={card.key === side ? 'Your review' : `${card.name}'s review`}
          review={card.review}
          waitingText={waitingText.replace('{name}', card.name)}
        />
      ))}
    </div>
  )
}
