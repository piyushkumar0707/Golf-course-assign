'use client'

import { useState, useEffect } from 'react'

interface Score {
  id: string
  score: number
  played_on: string
}

export default function ScoreEntry() {
  const [scores, setScores] = useState<Score[]>([])
  const [scoreInput, setScoreInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState('')
  const [editDate, setEditDate] = useState('')

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scores')
      if (res.ok) {
        const data = await res.json()
        setScores(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const validateScore = (s: string) => {
    const num = parseInt(s)
    return !isNaN(num) && num >= 1 && num <= 45
  }

  const validateDate = (d: string) => {
    const date = new Date(d)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    return date <= today && date >= oneYearAgo
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateScore(scoreInput)) {
      setError('Score must be between 1 and 45')
      return
    }
    if (!validateDate(dateInput)) {
      setError('Date must be within the last 12 months and not in the future')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: scoreInput, played_on: dateInput })
      })

      if (res.ok) {
        setScoreInput('')
        setDateInput('')
        fetchScores()
      } else {
        setError(await res.text())
      }
    } catch (e) {
      setError('Failed to save score')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (s: Score) => {
    setEditingId(s.id)
    setEditScore(s.score.toString())
    setEditDate(s.played_on)
  }

  const handleUpdate = async (id: string) => {
    if (!validateScore(editScore) || !validateDate(editDate)) {
      alert('Invalid score or date')
      return
    }

    try {
      const res = await fetch(`/api/scores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: parseInt(editScore), played_on: editDate })
      })
      if (res.ok) {
        setEditingId(null)
        fetchScores()
      } else {
        alert(await res.text())
      }
    } catch (e) {
      alert('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this score?')) return
    try {
      const res = await fetch(`/api/scores/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchScores()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div>Loading scores...</div>

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Enter Score</h3>
      
      <div className="mb-4 text-sm text-gray-500">
        Progress: {scores.length} of 5 scores entered
        {scores.length === 5 && ' (Adding a new score will replace the oldest one)'}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-start mb-8">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700">Stableford Score (1-45)</label>
          <input
            type="number"
            min="1" max="45"
            required
            value={scoreInput}
            onChange={e => setScoreInput(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700">Date Played</label>
          <input
            type="date"
            required
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          />
        </div>
        <div className="sm:pt-6 w-full sm:w-auto">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <h4 className="font-medium text-gray-900 mb-2">Recent Scores</h4>
      {scores.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No scores entered yet. Enter your last 5 scores to qualify for the draw.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {scores.map(s => (
            <li key={s.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              {editingId === s.id ? (
                <div className="flex gap-2 flex-1 items-center flex-wrap">
                  <input
                    type="number"
                    value={editScore}
                    onChange={e => setEditScore(e.target.value)}
                    className="border border-gray-300 rounded p-1 w-20 text-black"
                  />
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="border border-gray-300 rounded p-1 text-black"
                  />
                  <button onClick={() => handleUpdate(s.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 text-sm">Save</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-sm">Cancel</button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium text-gray-900">{s.score} pts</span>
                    <span className="text-gray-500 text-sm block sm:inline sm:ml-4">Played on {new Date(s.played_on).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleEditClick(s)} className="text-indigo-600 hover:text-indigo-900 text-sm inline-flex items-center">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
