// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import AppCalls from './components/AppCalls'
import SendAsa from './components/SendAsa'
import PayoutPanel from './components/PayoutPanel'
import Dashboard from './components/Dashboard'
import AdsenseCompanion from './components/AdsenseCompanion'
import AdsensePage from './components/AdsensePage'

interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [openAsaModal, setOpenAsaModal] = useState<boolean>(false)
  const [openPayoutModal, setOpenPayoutModal] = useState<boolean>(false)
  const [openDashboardModal, setOpenDashboardModal] = useState<boolean>(false)
  const [openAdsenseModal, setOpenAdsenseModal] = useState<boolean>(false)
  const [openAdsensePage, setOpenAdsensePage] = useState<boolean>(true)
  const [demoEarnings, setDemoEarnings] = useState<number>(1000)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleDemoModal = () => {
    setOpenDemoModal(!openDemoModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  const toggleAsaModal = () => {
    setOpenAsaModal(!openAsaModal)
  }

  const togglePayoutModal = () => {
    setOpenPayoutModal(!openPayoutModal)
  }

  const toggleDashboardModal = () => {
    setOpenDashboardModal(!openDashboardModal)
  }

  if (openAdsensePage) {
    // Correctly reduce demo earnings by the gross amount from the modal
    const handler = (e: Event) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detail = (e as any).detail as { gross?: number }
        const gross = Number(detail?.gross ?? 0)
        if (gross > 0) setDemoEarnings((v) => Math.max(0, v - gross))
      } catch { }
    }
    window.removeEventListener('payday:payout', handler as EventListener)
    window.addEventListener('payday:payout', handler as EventListener)
    return (
      <>
        <AdsensePage
          open={openAdsensePage}
          onClose={() => setOpenAdsensePage(false)}
          onPayout={() => { setOpenPayoutModal(true) }}
          earnings={demoEarnings}
        />
        <PayoutPanel
          openModal={openPayoutModal}
          setModalState={(v) => setOpenPayoutModal(v)}
          onSuccess={(gross) => setDemoEarnings((v) => Math.max(0, v - gross))}
        />
      </>
    )
  }

  return (
    <div className="hero min-h-screen">
      <div className="hero-content text-center rounded-lg p-6 max-w-md mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">PayDay</div>
          </h1>
          <p className="py-6">
            Instant AdSense payouts in USDC on Algorand TestNet.
          </p>

          <div className="grid">
            <div className="divider" />
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            {activeAddress && (
              <button data-test-id="dashboard" className="btn m-2" onClick={toggleDashboardModal}>
                Dashboard
              </button>
            )}

            {activeAddress && (
              <button data-test-id="transactions-demo" className="btn m-2" onClick={toggleDemoModal}>
                Transactions Demo
              </button>
            )}

            {activeAddress && (
              <>
                <button className="btn m-2" onClick={() => setOpenAdsenseModal(true)}>AdSense Companion (modal)</button>
                <button className="btn m-2" onClick={() => setOpenAdsensePage(true)}>AdSense Companion (page)</button>
              </>
            )}

            {activeAddress && (
              <button data-test-id="appcalls-demo" className="btn m-2" onClick={toggleAppCallsModal}>
                Contract Interactions Demo
              </button>
            )}

            {activeAddress && (
              <button data-test-id="asa-transfer-demo" className="btn m-2" onClick={toggleAsaModal}>
                ASA Transfer (USDC)
              </button>
            )}

            {activeAddress && (
              <button data-test-id="instant-payout" className="btn btn-primary m-2" onClick={togglePayoutModal}>
                Instant Payout
              </button>
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
          <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
          <SendAsa openModal={openAsaModal} setModalState={setOpenAsaModal} />
          <PayoutPanel openModal={openPayoutModal} setModalState={setOpenPayoutModal} />
          <Dashboard openModal={openDashboardModal} setModalState={setOpenDashboardModal} />
          <AdsenseCompanion
            openModal={openAdsenseModal}
            setModalState={setOpenAdsenseModal}
            onInstantPayout={() => { setOpenAdsenseModal(false); setOpenPayoutModal(true) }}
          />
          {/* AdSense page rendered as main when openAdsensePage=true */}
        </div>
      </div>
    </div>
  )
}

export default Home
