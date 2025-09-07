// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import AppCalls from './components/AppCalls'
import SendAsa from './components/SendAsa'
import PayoutPanel from './components/PayoutPanel'
import Dashboard from './components/Dashboard'

interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [openAsaModal, setOpenAsaModal] = useState<boolean>(false)
  const [openPayoutModal, setOpenPayoutModal] = useState<boolean>(false)
  const [openDashboardModal, setOpenDashboardModal] = useState<boolean>(false)
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

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">AlgoKit 🙂</div>
          </h1>
          <p className="py-6">
            This starter has been generated using official AlgoKit React template. Refer to the resource below for next steps.
          </p>

          <div className="grid">
            <a
              data-test-id="getting-started"
              className="btn btn-primary m-2"
              target="_blank"
              href="https://github.com/algorandfoundation/algokit-cli"
            >
              Getting started
            </a>

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
                Instant Payout (Demo)
              </button>
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
          <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
          <SendAsa openModal={openAsaModal} setModalState={setOpenAsaModal} />
          <PayoutPanel openModal={openPayoutModal} setModalState={setOpenPayoutModal} />
          <Dashboard openModal={openDashboardModal} setModalState={setOpenDashboardModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
