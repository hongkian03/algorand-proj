import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'

export async function getAssetDecimals(algorand: AlgorandClient, assetId: number): Promise<number> {
    const info = await algorand.client.algod.getAssetByID(assetId).do()
    return info.params?.decimals ?? 0
}

export async function getAccountAssetHolding(
    algorand: AlgorandClient,
    address: string,
    assetId: number,
): Promise<{ optedIn: boolean; amount: bigint }> {
    // 1) Indexer (if available)
    try {
        if (algorand.client.indexer) {
            const res = await algorand.client.indexer
                .lookupAccountAssets(address)
                // SDK uses camelCase for this builder
                .assetId(assetId as unknown as number)
                .do()
            const assets = (res.assets ?? []) as Array<{ 'asset-id': number; amount?: number | string }>
            if (assets.length > 0) {
                const amt = BigInt(assets[0].amount ?? 0)
                return { optedIn: true, amount: amt }
            }
        }
    } catch {
        // ignore
    }

    // 2) Algod direct asset holding endpoint (if supported by provider)
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await (algorand.client.algod as any).accountAssetInformation(address, assetId).do()
        const holding = res?.assetHolding ?? res?.['asset-holding']
        if (holding) {
            const amt = BigInt(holding.amount ?? 0)
            return { optedIn: true, amount: amt }
        }
    } catch {
        // ignore
    }

    // 3) Fallback to full Algod accountInformation
    const accountInfo = await algorand.client.algod.accountInformation(address).do()
    const holding = (accountInfo.assets ?? []).find((a: { 'asset-id': number }) => a['asset-id'] === assetId) as
        | { amount?: number | string }
        | undefined
    if (holding) {
        const amt = BigInt(holding.amount ?? 0)
        return { optedIn: true, amount: amt }
    }
    return { optedIn: false, amount: 0n }
}

export async function ensureAssetOptIn(
    algorand: AlgorandClient,
    signer: TransactionSignerAccount['signer'],
    address: string,
    assetId: number,
): Promise<void> {
    const { optedIn: alreadyOpted } = await getAccountAssetHolding(algorand, address, assetId)
    if (alreadyOpted) return

    await algorand.send.assetTransfer({
        signer,
        sender: address,
        receiver: address,
        assetId,
        amount: 0n,
    })
}

export async function transferAsset(
    algorand: AlgorandClient,
    signer: TransactionSignerAccount['signer'],
    sender: string,
    receiver: string,
    assetId: number,
    amountBaseUnits: bigint,
) {
    return algorand.send.assetTransfer({
        signer,
        sender,
        receiver,
        assetId,
        amount: amountBaseUnits,
    })
}


