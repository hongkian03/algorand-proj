import { useState } from 'react'

interface Props {
  openModal: boolean
  setModalState: (value: boolean) => void
  onInstantPayout: () => void
}

const AdsenseCompanion = ({ openModal, setModalState, onInstantPayout }: Props) => {
  const [earnings] = useState<number>(0)
  const threshold = 100

  return (
    <dialog id="adsense_companion_modal" className={`modal ${openModal ? 'modal-open' : ''}`} style={{ display: openModal ? 'block' : 'none' }}>
      <form method="dialog" className="modal-box">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-2xl font-bold">Google AdSense</div>
          <div className="opacity-60">Payments info</div>
        </div>

        <div className="mb-4">
          <div className="text-sm opacity-80">PAYMENTS ACCOUNT</div>
          <div className="mt-1 inline-block border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black">AdSense (United States)</div>
        </div>

        <div className="mb-4">
          <div className="text-xl font-semibold mb-3">Payments</div>

          <div className="border rounded p-4 mb-4 bg-white text-black">
            <div className="text-lg font-semibold mb-2">Your earnings</div>
            <div className="text-sm opacity-70 mb-3">Paid monthly if the total is at least ${threshold.toFixed(2)} (your payout threshold)</div>
            <div className="h-2 bg-gray-200 rounded mb-2" />
            <div className="flex justify-between text-sm opacity-70">
              <div>You&apos;ve reached 0% of your payment threshold</div>
              <div>Payment threshold: ${threshold.toFixed(2)}</div>
            </div>
            <div className="mt-3 text-4xl font-bold">${earnings.toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-4 bg-white text-black">
              <div className="text-xl font-semibold mb-2">Transactions</div>
              <ul className="text-sm">
                <li className="flex justify-between py-1"><span>Nov 1 – 2, 2024</span><span>$0.00</span></li>
                <li className="flex justify-between py-1"><span>Oct 1 – 31, 2024</span><span>$0.00</span></li>
                <li className="flex justify-between py-1"><span>Sep 1 – 30, 2024</span><span>$0.00</span></li>
              </ul>
            </div>
            <div className="border rounded p-4 bg-white text-black">
              <div className="text-xl font-semibold mb-2">How you get paid</div>
              <div className="opacity-70 text-sm">Bank account••••</div>
            </div>
          </div>
        </div>

        <div className="modal-action flex gap-2">
          <button type="button" className="btn" onClick={() => setModalState(false)}>Close</button>
          <button type="button" className="btn btn-primary" onClick={onInstantPayout}>Instant payout (USDC)</button>
        </div>
      </form>
    </dialog>
  )
}

export default AdsenseCompanion


