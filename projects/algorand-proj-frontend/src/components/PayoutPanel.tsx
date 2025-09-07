import { useState, useMemo, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { ensureAssetOptIn, getAccountAssetHolding, getAssetDecimals, transferAsset } from '../utils/asa'
import { getVaultAPI } from '../services/VaultService'

interface PayoutPanelProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  onSuccess?: (grossAmount: number) => void
}

const DEFAULT_FEE_BPS = 150 // 1.5%

const PayoutPanel = ({ openModal, setModalState, onSuccess }: PayoutPanelProps) => {
  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const [assetId, setAssetId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [optedIn, setOptedIn] = useState<boolean>(true)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

  // Prefill USDC/TestUSDC from env if provided
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env: any = import.meta.env
    const envAsset = env?.VITE_USDC_ASSET_ID || env?.VITE_STABLECOIN_ASSET_ID || '745492577'
    if (!assetId) setAssetId(String(envAsset))
  }, [assetId])

  // Track opt-in status for the current asset/account
  useEffect(() => {
    const check = async () => {
      if (!activeAddress) return
      const idNum = Number(assetId)
      if (!Number.isFinite(idNum) || idNum <= 0) return
      try {
        const { optedIn } = await getAccountAssetHolding(algorand, activeAddress, idNum)
        setOptedIn(optedIn)
      } catch {
        setOptedIn(true)
      }
    }
    check()
  }, [activeAddress, assetId, algorand])

  const feePercent = DEFAULT_FEE_BPS / 10000
  const amountNum = Number(amount)
  const feeAmount = Number.isFinite(amountNum) ? amountNum * feePercent : 0
  const netAmount = Number.isFinite(amountNum) ? Math.max(amountNum - feeAmount, 0) : 0

  const isValidAddress = (activeAddress?.length ?? 0) === 58
  const isValidAssetId = /^\d+$/.test(assetId.trim())
  const isValidAmount = amountNum > 0

  const handleEnableAsset = async () => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      return
    }
    const id = Number(assetId)
    if (!Number.isFinite(id) || id <= 0) {
      enqueueSnackbar('Provide a valid Asset ID', { variant: 'warning' })
      return
    }
    setLoading(true)
    try {
      await ensureAssetOptIn(algorand, transactionSigner, activeAddress, id)
      setOptedIn(true)
      enqueueSnackbar('USDC enabled for your wallet', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Enable failed: ${e instanceof Error ? e.message : String(e)}`, { variant: 'error' })
    }
    setLoading(false)
  }

  const handlePayout = async () => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      return
    }
    if (!isValidAssetId || !isValidAmount) {
      enqueueSnackbar('Provide a valid Asset ID and amount', { variant: 'warning' })
      return
    }
    setLoading(true)
    try {
      const id = Number(assetId)
      const decimals = await getAssetDecimals(algorand, id)
      const baseUnits = BigInt(Math.trunc(netAmount * 10 ** decimals))

      // Use vault if available, otherwise self-transfer fallback
      const vault = await getVaultAPI(algorand, activeAddress)
      if (vault.isAvailable) {
        // Check if user is opted into the ASA
        const { optedIn } = await getAccountAssetHolding(algorand, activeAddress, id)

        // Build an atomic group: optional opt-in + release_simple
        // Dynamically import the typed vault client (e.g., GetMoney)
        const clientBaseName = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_VAULT_CLIENT || 'GetMoney'
        const appIdStr = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_VAULT_APP_ID
        if (!appIdStr) throw new Error('Vault app id not configured')
        const appId = Number(appIdStr)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await import(`../contracts/${clientBaseName}.ts`)
        // Prefer concrete client class name like GetMoneyClient
        const clientExportName = Object.keys(mod).find((k) => k.endsWith('Client'))
        if (!clientExportName) throw new Error('Vault client not found')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ClientCtor: any = mod[clientExportName]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client: any = new ClientCtor({ algorand, appId, defaultSender: activeAddress })

        const group = client.newGroup()

        if (!optedIn) {
          const sp = await algorand.client.algod.getTransactionParams().do()
          const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            // TS type mismatch across versions; cast to any to avoid incorrect lints
            from: activeAddress,
            to: activeAddress,
            assetIndex: id,
            amount: 0,
            suggestedParams: sp,
          } as unknown as any)
          group.addTransaction(optInTxn, transactionSigner)
        }

        group.releaseSimple({ args: { recipient: activeAddress, amount: baseUnits } })
        const sendResult = await group.send({ sender: activeAddress, signer: transactionSigner, extraFee: algo(0.002) })
        enqueueSnackbar(`Vault payout sent: ${sendResult.txIds[0]}`, { variant: 'success' })
      } else {
        const result = await transferAsset(algorand, transactionSigner, activeAddress, activeAddress, id, baseUnits)
        enqueueSnackbar(`Payout sent (net): ${result.txIds[0]}`, { variant: 'success' })
      }
      // Inform parent about gross payout for demo earnings update
      try {
        const gross = Number(amount)
        if (!Number.isNaN(gross) && gross > 0) onSuccess?.(gross)
      } catch { }
      setAmount('')
    } catch (e) {
      enqueueSnackbar(`Failed payout: ${e instanceof Error ? e.message : String(e)}`, { variant: 'error' })
    }
    setLoading(false)
  }

  return (
    <dialog id="payout_panel_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box payday-modal">
        <h3 className="font-bold text-xl">Instant Payout (Test Demo)</h3>
        <p className="text-sm opacity-70 mb-2">Fee: {(feePercent * 100).toFixed(2)}%</p>
        {showAdvanced && (
          <input
            type="text"
            placeholder="Asset ID (USDC)"
            className="input input-bordered w-full mb-2"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          />
        )}
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Gross amount"
          className="input input-bordered w-full mb-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="text-sm mb-2">
          <div>Fee: {isValidAmount ? feeAmount.toFixed(6) : '-'}</div>
          <div>Net to receive: {isValidAmount ? netAmount.toFixed(6) : '-'}</div>
        </div>
        <div className="mb-2 flex items-center justify-end">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide Advanced' : 'Advanced'}
          </button>
        </div>
        {isValidAssetId && !optedIn && (
          <div className="alert alert-info mb-2 text-sm">
            <div className="flex items-center justify-between w-full">
              <span>This wallet isn’t enabled for this asset yet.</span>
              <button type="button" className="btn btn-sm" onClick={handleEnableAsset}>
                {loading ? <span className="loading loading-spinner" /> : 'Enable USDC'}
              </button>
            </div>
          </div>
        )}
        <div className="modal-action grid">
          <button type="button" className="btn" onClick={() => setModalState(!openModal)}>Close</button>
          <button type="button" className={`btn btn-primary ${(isValidAddress && isValidAssetId && isValidAmount) ? '' : 'btn-disabled'}`} onClick={handlePayout}>
            {loading ? <span className="loading loading-spinner" /> : 'Request Payout'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default PayoutPanel


