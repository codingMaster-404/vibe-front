import { Link } from 'react-router-dom'
import LandingGNB from '../components/layout/LandingGNB'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1024] via-[#121935] to-[#0f172a] text-slate-100">
      <LandingGNB />
      <main className="max-w-6xl mx-auto px-6 py-24">
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-violet-300 font-semibold mb-3">AI 기반 학습 관리</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-5">
              학습 데이터를 한눈에,
              <br />
              집중도는 실시간으로
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Vibe는 학습 집중도, 진도, 학습 로그를 통합 분석해
              학생과 강사가 더 빠르게 학습 상태를 파악하도록 돕습니다.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl bg-violet-600 px-6 py-3 text-base font-bold text-white hover:bg-violet-500 transition"
            >
              내 강의실 입장하기
            </Link>
          </div>
          <div className="rounded-2xl border border-violet-300/20 bg-slate-900/60 p-6 shadow-2xl">
            <div className="grid gap-4">
              <FeatureCard title="실시간 집중도 모니터링" desc="학습 중 집중도 변화를 즉시 확인" />
              <FeatureCard title="강의별 학습 분석" desc="강의/학생 단위 데이터로 빠른 피드백" />
              <FeatureCard title="역할 기반 대시보드" desc="학생, 강사, 운영자별 맞춤 관리 화면" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ title, desc }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
      <p className="font-semibold text-violet-200">{title}</p>
      <p className="text-sm text-slate-300 mt-1">{desc}</p>
    </article>
  )
}

