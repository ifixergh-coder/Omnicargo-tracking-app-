import PublicNav from '../components/PublicNav'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-navy mb-4">Contact us</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-2 text-slate">
          <p><span className="font-medium text-navy">Phone:</span> [phone number]</p>
          <p><span className="font-medium text-navy">Email:</span> [email address]</p>
          <p><span className="font-medium text-navy">Address:</span> [physical address]</p>
        </div>
      </div>
    </div>
  )
}
