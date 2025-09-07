from algopy import ARC4Contract, Txn, Bytes, UInt64, Asset, Account, itxn, Global
from algopy.arc4 import abimethod


class GetMoney(ARC4Contract):
    # creation method
    @abimethod(create="require")
    def init(self, oracle_pubkey: Bytes, usdt_asset_id: UInt64) -> None:
        # store admin and initial config
        self.admin = Txn.sender
        self.oracle_pk = oracle_pubkey
        self.asset_id = usdt_asset_id
        self.paused = UInt64(0)

    # set the oracle public key
    @abimethod
    def set_oracle(self, new_key: Bytes) -> None:
        assert Txn.sender == self.admin
        self.oracle_pk = new_key

    # set the asset (ASA) id
    @abimethod
    def set_asset(self, asset_id: UInt64) -> None:
        assert Txn.sender == self.admin
        self.asset_id = asset_id

    # clear remaining funds from the contract
    @abimethod
    def sweep(self, receiver: Account) -> None:
        assert Txn.sender == self.admin
        # Close out the contract's ASA holding to receiver (no need to read balance)
        asset = Asset(self.asset_id)
        itxn.AssetTransfer(
            xfer_asset=asset,
            asset_amount=0,
            asset_close_to=receiver,
            asset_receiver=receiver,
        ).submit()

    # simple admin-controlled release for demo/hackathon
    @abimethod
    def release_simple(self, recipient: Account, amount: UInt64) -> None:
        assert Txn.sender == self.admin
        asset = Asset(self.asset_id)
        itxn.AssetTransfer(
            xfer_asset=asset,
            asset_amount=amount,
            asset_receiver=recipient,
        ).submit()

    # App opt-in to configured ASA so it can hold a balance
    @abimethod
    def opt_in_asset(self) -> None:
        assert Txn.sender == self.admin
        asset = Asset(self.asset_id)
        itxn.AssetTransfer(
            xfer_asset=asset,
            asset_amount=0,
            asset_receiver=Global.current_application_address,
        ).submit()




