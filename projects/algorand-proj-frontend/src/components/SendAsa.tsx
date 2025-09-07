import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface SendAsaInterface {
    openModal: boolean
    setModalState: (value: boolean) => void
}

const SendAsa = ({ openModal, setModalState }: SendAsaInterface) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [receiverAddress, setReceiverAddress] = useState<string>('')
    const [assetId, setAssetId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')

    const algodConfig = getAlgodConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({ algodConfig })

    const { enqueueSnackbar } = useSnackbar()
    const { transactionSigner, activeAddress } = useWallet()

    const handleSubmitAsa = async () => {
        setLoading(true)

        if (!transactionSigner || !activeAddress) {
            enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
            setLoading(false)
            return
        }

        const parsedAssetId = Number(assetId)
        const parsedAmount = Number(amount)
        if (!Number.isFinite(parsedAssetId) || parsedAssetId <= 0) {
            enqueueSnackbar('Invalid Asset ID', { variant: 'warning' })
            setLoading(false)
            return
        }
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            enqueueSnackbar('Invalid amount', { variant: 'warning' })
            setLoading(false)
            return
        }

        try {
            enqueueSnackbar('Preparing asset transfer...', { variant: 'info' })

            // Fetch asset decimals to convert display units to base units
            const assetInfo = await algorand.client.algod.getAssetByID(parsedAssetId).do()
            const decimals: number = assetInfo.params.decimals ?? 0
            const baseUnits = BigInt(Math.trunc(parsedAmount * 10 ** decimals))

            const result = await algorand.send.assetTransfer({
                signer: transactionSigner,
                sender: activeAddress,
                receiver: receiverAddress,
                assetId: parsedAssetId,
                amount: baseUnits,
            })

            enqueueSnackbar(`ASA transfer sent: ${result.txIds[0]}`, { variant: 'success' })
            setReceiverAddress('')
            setAssetId('')
            setAmount('')
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e)
            enqueueSnackbar(`Failed to send ASA: ${message}`, { variant: 'error' })
        }

        setLoading(false)
    }

    const isValidAddress = receiverAddress.length === 58
    const isValidAssetId = /^\d+$/.test(assetId.trim())
    const isValidAmount = Number(amount) > 0

    return (
        <dialog id="send_asa_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`} style={{ display: openModal ? 'block' : 'none' }}>
            <form method="dialog" className="modal-box">
                <h3 className="font-bold text-lg">Send ASA (e.g., USDC) Transfer</h3>
                <br />
                <input
                    type="text"
                    placeholder="Receiver address"
                    className="input input-bordered w-full mb-2"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Asset ID (e.g., TestNet USDC)"
                    className="input input-bordered w-full mb-2"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                />
                <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Amount (in whole units)"
                    className="input input-bordered w-full"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <div className="modal-action grid">
                    <button className="btn" onClick={() => setModalState(!openModal)}>
                        Close
                    </button>
                    <button
                        className={`btn ${(isValidAddress && isValidAssetId && isValidAmount) ? '' : 'btn-disabled'}`}
                        onClick={handleSubmitAsa}
                    >
                        {loading ? <span className="loading loading-spinner" /> : 'Send ASA'}
                    </button>
                </div>
            </form>
        </dialog>
    )
}

export default SendAsa



