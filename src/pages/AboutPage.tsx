import PublicNav from '../components/PublicNav'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-navy mb-4">About OmniCargo</h1>
        <p className="text-slate leading-relaxed mb-4">
          OmniCargo Solutions Ltd is a freight and delivery company based in Tema/Accra, Ghana,
          moving goods reliably across the country and beyond.
        </p>
        <p className="text-slate leading-relaxed">
          [Add more about your company's story, coverage areas, and what makes OmniCargo different here.]
        </p>
      </div>
    </div>
  )
}
