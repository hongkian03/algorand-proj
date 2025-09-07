import { useState, useMemo } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { ensureAssetOptIn, getAssetDecimals, transferAsset } from '../utils/asa'
import { getVaultAPI } from '../services/VaultService'

interface PayoutPanelProps {
    openModal: boolean
    setModalState: (value: boolean) => void
}

const DEFAULT_FEE_BPS = 150 // 1.5%

const PayoutPanel = ({ openModal, setModalState }: PayoutPanelProps) => {
    const { transactionSigner, activeAddress } = useWallet()
    const { enqueueSnackbar } = useSnackbar()

    const [assetId, setAssetId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)

    const algodConfig = getAlgodConfigFromViteEnvironment()
    const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

    const feePercent = DEFAULT_FEE_BPS / 10000
    const amountNum = Number(amount)
    const feeAmount = Number.isFinite(amountNum) ? amountNum * feePercent : 0
    const netAmount = Number.isFinite(amountNum) ? Math.max(amountNum - feeAmount, 0) : 0

    const isValidAddress = (activeAddress?.length ?? 0) === 58
    const isValidAssetId = /^\d+$/.test(assetId.trim())
    const isValidAmount = amountNum > 0

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
            await ensureAssetOptIn(algorand, transactionSigner, activeAddress, id)
            const decimals = await getAssetDecimals(algorand, id)
            const baseUnits = BigInt(Math.trunc(netAmount * 10 ** decimals))

            // Use vault if available, otherwise self-transfer fallback
            const vault = await getVaultAPI(algorand, activeAddress)
            if (vault.isAvailable) {
                const txId = await vault.release(id, baseUnits, activeAddress)
                enqueueSnackbar(`Vault payout sent: ${txId}`, { variant: 'success' })
            } else {
                const result = await transferAsset(algorand, transactionSigner, activeAddress, activeAddress, id, baseUnits)
                enqueueSnackbar(`Payout sent (net): ${result.txIds[0]}`, { variant: 'success' })
            }
            setAmount('')
        } catch (e) {
            enqueueSnackbar(`Failed payout: ${e instanceof Error ? e.message : String(e)}`, { variant: 'error' })
        }
        setLoading(false)
    }

    return (
        <dialog id="payout_panel_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`} style={{ display: openModal ? 'block' : 'none' }}>
            <form method="dialog" className="modal-box">
                <h3 className="font-bold text-xl">Instant Payout (Test Demo)</h3>
                <p className="text-sm opacity-70 mb-2">Fee: {(feePercent * 100).toFixed(2)}%</p>
                <input
                    type="text"
                    placeholder="Asset ID (e.g., your TestUSDC)"
                    className="input input-bordered w-full mb-2"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                />
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
                <div className="modal-action grid">
                    <button className="btn" onClick={() => setModalState(!openModal)}>Close</button>
                    <button className={`btn ${(isValidAddress && isValidAssetId && isValidAmount) ? '' : 'btn-disabled'}`} onClick={handlePayout}>
                        {loading ? <span className="loading loading-spinner" /> : 'Request Payout'}
                    </button>
                </div>
            </form>
        </dialog>
    )
}

export default PayoutPanel


