import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface Props {
  open: boolean
  onClose: () => void
  onPayout: () => void
  earnings?: number
}

const AdsensePage = ({ open, onClose, onPayout, earnings: earningsProp }: Props) => {
  const { activeAddress } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

  const [threshold] = useState<number>(100)
  const [internalEarnings, setInternalEarnings] = useState<number>(1000)

  useEffect(() => {
    if (!open) return
    if (earningsProp !== undefined) return
    // For the demo, show $1000 to clearly illustrate instant payout vs threshold
    setInternalEarnings(1000)
  }, [open, earningsProp])

  if (!open) return null

  return (
    <div className="min-h-screen" style={{ background: '#fff', color: '#111' }}>
      <div style={{ background: '#202124', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontWeight: 700 }}>Google AdSense</div>
        <div style={{ opacity: 0.8 }}>Payments info</div>
      </div>

      <div style={{ maxWidth: 1240, margin: '32px auto', padding: '0 24px', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ marginBottom: 14, fontSize: 12, color: '#5f6368' }}>PAYMENTS ACCOUNT</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #dadce0', borderRadius: 6, padding: '12px 14px', background: '#fff' }}>
          AdSense (United States)
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, margin: '28px 0 16px' }}>Payments</h2>

        {/* Earnings Card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, border: '1px solid #dadce0', background: '#fff', borderRadius: 10, padding: 24, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Your earnings</div>
            <div style={{ fontSize: 14, color: '#5f6368', marginBottom: 14 }}>Paid monthly if the total is at least ${threshold.toFixed(2)} (your payout threshold)</div>
            <div style={{ height: 8, background: '#e8eaed', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: '100%', height: '100%', background: '#1a73e8' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5f6368' }}>
              <div>You&apos;ve reached 100% of your payment threshold</div>
              <div>Payment threshold: ${threshold.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>${(earningsProp ?? internalEarnings).toFixed(2)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'stretch' }}>
          {/* Transactions */}
          <div style={{ border: '1px solid #dadce0', background: '#fff', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Transactions</div>
            <ul style={{ fontSize: 14, color: '#1a73e8' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Nov 1 – 2, 2024</span><span style={{ color: '#3c4043' }}>$0.00</span></li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Oct 1 – 31, 2024</span><span style={{ color: '#3c4043' }}>$0.00</span></li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Sep 1 – 30, 2024</span><span style={{ color: '#3c4043' }}>$0.00</span></li>
            </ul>
          </div>

          {/* How you get paid */}
          <div style={{ border: '1px solid #dadce0', background: '#fff', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>How you get paid</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {/* Bank account card with simple icon */}
              <div style={{ border: '1px solid #dadce0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 4L21 9V11H3V9Z" fill="#5f6368" />
                    <path d="M5 12H7V18H5V12ZM9 12H11V18H9V12ZM13 12H15V18H13V12ZM17 12H19V18H17V12Z" fill="#5f6368" />
                    <path d="M3 19H21V20H3V19Z" fill="#5f6368" />
                  </svg>
                  <div style={{ fontWeight: 600 }}>Bank account (~10 days)</div>
                </div>
                <div style={{ fontSize: 12, color: '#5f6368' }}>•••• 1234</div>
              </div>
              {/* PayPal card */}
              <div style={{ border: '1px solid #dadce0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>P</div>
                  <div style={{ fontWeight: 600 }}>PayPal<br />(~3 days)</div>
                </div>
                <div style={{ fontSize: 12, color: '#5f6368' }}>•••• 1234</div>
              </div>
              {/* PayDay card */}
              <div style={{ border: '2px dashed #a613c3', borderRadius: 10, padding: 16, background: 'linear-gradient(180deg,#faf5ff,#ffffff)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>PayDay (USDC — instant)</div>
                <button onClick={onPayout} style={{ alignSelf: 'start', background: '#a613c3', color: '#fff', border: 0, padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}>Payout now</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <button onClick={onClose} style={{ border: '1px solid #dadce0', background: '#fff', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}>Back</button>
        </div>
      </div>
    </div>
  )
}

export default AdsensePage


