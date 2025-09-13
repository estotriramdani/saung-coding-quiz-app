export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <div className="text-warning text-6xl mb-4">⏳</div>
          <h2 className="card-title justify-center text-2xl mb-4">
            Approval Pending
          </h2>
          <p className="mb-4">
            Your educator account is currently under review by our administrators.
          </p>
          <p className="text-sm opacity-70 mb-6">
            You will receive an email notification once your account has been approved.
            This process typically takes 1-3 business days.
          </p>
          <div className="card-actions justify-center">
            <a href="/" className="btn btn-primary">
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
