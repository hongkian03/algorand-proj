import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { getAccountAssetHolding, getAssetDecimals } from '../utils/asa'

interface DashboardProps {
    openModal: boolean
    setModalState: (value: boolean) => void
}

type TxnRow = {
    id: string
    round: number
    amount: string
    from: string
    to: string
}

const Dashboard = ({ openModal, setModalState }: DashboardProps) => {
    const { activeAddress } = useWallet()
    const { enqueueSnackbar } = useSnackbar()

    const [assetId, setAssetId] = useState<string>('')
    const [algoBalance, setAlgoBalance] = useState<string>('-')
    const [asaBalance, setAsaBalance] = useState<string>('-')
    const [recent, setRecent] = useState<TxnRow[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    const algodConfig = getAlgodConfigFromViteEnvironment()
    let safeIndexerConfig: ReturnType<typeof getIndexerConfigFromViteEnvironment> | undefined
    try {
        safeIndexerConfig = getIndexerConfigFromViteEnvironment()
    } catch {
        safeIndexerConfig = undefined
    }
    const algorand = useMemo(
        () => (safeIndexerConfig ? AlgorandClient.fromConfig({ algodConfig, indexerConfig: safeIndexerConfig }) : AlgorandClient.fromConfig({ algodConfig })),
        [algodConfig, safeIndexerConfig]
    )

    const load = async () => {
        if (!activeAddress) return
        setLoading(true)
        try {
            // ALGO balance
            const acct = await algorand.client.algod.accountInformation(activeAddress).do()
            const micro = Number(acct.amount ?? 0)
            setAlgoBalance((micro / 1_000_000).toFixed(6))

            // ASA balance
            if (/^\d+$/.test(assetId.trim())) {
                const id = Number(assetId)
                const decimals = await getAssetDecimals(algorand, id)
                const { amount } = await getAccountAssetHolding(algorand, activeAddress, id)
                const asNumber = Number(amount)
                setAsaBalance((asNumber / 10 ** decimals).toFixed(decimals))

                // Recent ASA transfers
                try {
                    if (safeIndexerConfig && algorand.client.indexer) {
                        const res = await algorand.client.indexer
                            .lookupAccountTransactions(activeAddress)
                            .assetID(id)
                            .txType('axfer')
                            .limit(10)
                            .do()
                        const rows: TxnRow[] = (res.transactions || []).map((t: any) => ({
                            id: t.id,
                            round: t['confirmed-round'],
                            amount: String(t['asset-transfer-transaction']?.amount ?? 0),
                            from: t.sender,
                            to: t['asset-transfer-transaction']?.receiver ?? '',
                        }))
                        setRecent(rows)
                    } else {
                        setRecent([])
                    }
                } catch (e) {
                    console.warn('Indexer fetch failed', e)
                    setRecent([])
                }
            } else {
                setAsaBalance('-')
                setRecent([])
            }
        } catch (e) {
            // Log exact reason and show brief message
            // eslint-disable-next-line no-console
            console.error('Failed to load balances', e)
            enqueueSnackbar(`Failed to load balances: ${e instanceof Error ? e.message : String(e)}`, { variant: 'error' })
        }
        setLoading(false)
    }


    useEffect(() => {
        if (openModal) {
            void load()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openModal])

    return (
        <dialog id="dashboard_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`} style={{ display: openModal ? 'block' : 'none' }}>
            <form method="dialog" className="modal-box">
                <h3 className="font-bold text-xl">Dashboard</h3>
                <div className="mb-2">ALGO Balance: {algoBalance}</div>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        placeholder="Asset ID (optional)"
                        className="input input-bordered w-full"
                        value={assetId}
                        onChange={(e) => setAssetId(e.target.value)}
                    />
                    <button type="button" className="btn" onClick={load}>
                        {loading ? <span className="loading loading-spinner" /> : 'Refresh'}
                    </button>
                </div>
                <div className="mb-2">ASA Balance: {asaBalance}</div>
                <div className="mb-2">
                    <div className="font-semibold">Recent ASA Transfers</div>
                    <ul className="text-sm max-h-40 overflow-auto">
                        {recent.length === 0 && <li className="opacity-60">No recent transfers</li>}
                        {recent.map((r) => (
                            <li key={r.id} className="py-1">
                                <a className="link" target="_blank" href={`https://lora.algokit.io/${algodConfig.network || 'testnet'}/tx/${r.id}/`}>
                                    {r.id.slice(0, 6)}...{r.id.slice(-6)}
                                </a>{' '}
                                • {r.amount} • {r.from === activeAddress ? 'out' : 'in'}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="modal-action">
                    <button type="button" className="btn" onClick={() => setModalState(!openModal)}>Close</button>
                </div>
            </form>
        </dialog>
    )
}

export default Dashboard


