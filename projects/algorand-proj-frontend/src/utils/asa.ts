import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'

export async function getAssetDecimals(algorand: AlgorandClient, assetId: number): Promise<number> {
    const info = await algorand.client.algod.getAssetByID(assetId).do()
    return info.params?.decimals ?? 0
}

export async function ensureAssetOptIn(
    algorand: AlgorandClient,
    signer: TransactionSignerAccount['signer'],
    address: string,
    assetId: number,
): Promise<void> {
    const accountInfo = await algorand.client.algod.accountInformation(address).do()
    const alreadyOpted = (accountInfo.assets ?? []).some((a: { 'asset-id': number }) => a['asset-id'] === assetId)
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


