import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'

export type VaultAPI = {
    isAvailable: boolean
    release: (assetId: number, amountBaseUnits: bigint, receiver: string) => Promise<string>
    fund?: (assetId: number, amountBaseUnits: bigint) => Promise<string>
}

function getEnv(name: string): string | undefined {
    // Vite injects import.meta.env at build time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = import.meta.env
    return v?.[name] as string | undefined
}

export async function getVaultAPI(algorand: AlgorandClient, defaultSender?: string): Promise<VaultAPI> {
    // Optional configuration: VITE_VAULT_CLIENT and VITE_VAULT_APP_ID
    const clientBaseName = getEnv('VITE_VAULT_CLIENT') || 'Vault'
    const appIdStr = getEnv('VITE_VAULT_APP_ID')

    try {
        // Try to import a generated client from src/contracts/<clientBaseName>.ts
        // This will succeed once your teammate drops the typed client in place.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod: Record<string, unknown> = await import(`../contracts/${clientBaseName}.ts`)

        // Find a *Factory export (e.g., VaultFactory)
        const factoryExportName = Object.keys(mod).find((k) => k.endsWith('Factory'))
        if (!factoryExportName) throw new Error('Factory export not found')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FactoryCtor = (mod as any)[factoryExportName]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const factory: any = new FactoryCtor({ algorand, defaultSender })

        let appClient: any | undefined
        if (appIdStr) {
            const appId = Number(appIdStr)
            // Common method names across client versions
            if (typeof factory.getAppClient === 'function') {
                appClient = await factory.getAppClient({ appId })
            } else if (typeof factory.appClientFromId === 'function') {
                appClient = await factory.appClientFromId(appId)
            }
        }

        if (!appClient) {
            // As a fallback we expose no-op availability until appId is provided
            return { isAvailable: false, release: async () => Promise.reject(new Error('Vault appId not set')) }
        }

        return {
            isAvailable: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            release: async (assetId: number, amountBaseUnits: bigint, receiver: string): Promise<string> => {
                // Try common method names: release, payout, disburse
                const args = { assetId, amount: amountBaseUnits, to: receiver }
                const sendObj = appClient.send || appClient.methods || appClient
                const fn =
                    sendObj?.release || sendObj?.payout || sendObj?.disburse || sendObj?.['release'] || sendObj?.['payout'] || sendObj?.['disburse']
                if (!fn) throw new Error('Vault method not found on client')
                const resp = await fn({ args }, undefined, { extraFee: algo(0.002) })
                // Normalized return: prefer tx id if present
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const r: any = resp
                return r?.txIds?.[0] || r?.transactionId || 'ok'
            },
            // Optional funding helper
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fund: async (assetId: number, amountBaseUnits: bigint): Promise<string> => {
                const args = { assetId, amount: amountBaseUnits }
                const sendObj = appClient.send || appClient.methods || appClient
                const fn = sendObj?.fund || sendObj?.['fund']
                if (!fn) throw new Error('Vault fund method not found')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const resp: any = await fn({ args }, undefined, { extraFee: algo(0.002) })
                return resp?.txIds?.[0] || resp?.transactionId || 'ok'
            },
        }
    } catch {
        // No vault client yet; expose an unavailable API
        return { isAvailable: false, release: async () => Promise.reject(new Error('Vault client not found')) }
    }
}


