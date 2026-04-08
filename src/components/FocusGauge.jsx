import { Flame } from 'lucide-react'

const getTone = (score) => {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function FocusGauge({ focusScore = 0, isTracking = false }) {
  const clamped = Math.max(0, Math.min(100, focusScore))
  const tone = getTone(clamped)

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-800/60 p-5 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${tone}`} />
          <h3 className="text-sm font-semibold text-white">실시간 몰입도</h3>
        </div>
        <span className="text-xs text-slate-400">
          {isTracking ? '측정 중' : '대기 중'}
        </span>
      </div>

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400 transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <p className={`text-lg font-bold ${tone}`}>{clamped}점</p>
    </div>
  )
}

export default FocusGauge
