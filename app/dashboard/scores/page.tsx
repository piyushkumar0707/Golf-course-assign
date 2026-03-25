'use client'

import ScoreEntry from '@/components/ScoreEntry'

export default function DashboardScoresPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Scores</h1>
      <p className="text-gray-500 mb-8">Only your 5 most recent scores are used for the monthly prize draw. Enter your stableford scores (ranging from 1 to 45) along with the date played to qualify.</p>
      <ScoreEntry />
    </div>
  )
}
