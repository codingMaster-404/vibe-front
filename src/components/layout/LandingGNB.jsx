import { Link } from 'react-router-dom'

export default function LandingGNB() {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-300/20 bg-slate-950/85 backdrop-blur">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link to="/" className="text-violet-300 font-extrabold tracking-wide">Vibe</Link>
        <Link
          to="/login"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
        >
          내 강의실 입장하기
        </Link>
      </div>
    </header>
  )
}

