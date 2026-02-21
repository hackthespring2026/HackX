import json
from web3 import Web3
from decouple import config

def anchor_to_sepolia(event_type, event_hash):
    # 1. Connect using your Alchemy URL
    w3 = Web3(Web3.HTTPProvider(config('SEPOLIA_RPC_URL')))
    
    # 2. Setup Account
    account = w3.eth.account.from_key(config('PRIVATE_KEY'))
    
    # 3. Setup Contract using the Shortcut ABI
    contract = w3.eth.contract(
        address=config('CONTRACT_ADDRESS'), 
        abi=json.loads(config('CONTRACT_ABI'))
    )

    # 4. Send Transaction
    nonce = w3.eth.get_transaction_count(account.address)
    tx = contract.functions.anchorEvent(event_type, event_hash).build_transaction({
        'chainId': 11155111,
        'gas': 100000,
        'maxFeePerGas': w3.to_wei('2', 'gwei'),
        'maxPriorityFeePerGas': w3.to_wei('1', 'gwei'),
        'nonce': nonce,
    })

    signed_tx = w3.eth.account.sign_transaction(tx, private_key=config('PRIVATE_KEY'))
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    return w3.to_hex(tx_hash)