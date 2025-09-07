import logging
import os

import algokit_utils

logger = logging.getLogger(__name__)


def deploy() -> None:
    from smart_contracts.artifacts.get_money.get_money_client import GetMoneyFactory, InitArgs

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer_ = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(GetMoneyFactory, default_sender=deployer_.address)

    # Read optional env for initial config
    oracle_hex = os.environ.get("ORACLE_PUBKEY_HEX", "")
    if oracle_hex:
        try:
            oracle_pk = bytes.fromhex(oracle_hex)
        except ValueError:
            oracle_pk = bytes(32)
    else:
        oracle_pk = bytes(32)
    asset_id_str = os.environ.get("ASSET_ID", "0")
    try:
        asset_id = int(asset_id_str)
    except ValueError:
        asset_id = 0

    # Perform create using explicit send.create.init with args
    client, create_result = factory.send.create.init(
        InitArgs(oracle_pubkey=oracle_pk, usdt_asset_id=asset_id)
    )

    logger.info(
        f"Deployed {client.app_name} with app id {create_result.app_id}; app address {create_result.app_address}"
    )


