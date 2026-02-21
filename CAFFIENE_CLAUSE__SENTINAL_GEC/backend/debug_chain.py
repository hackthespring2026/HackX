from web3 import Web3
from decouple import config
import json
import os
import sys

# Load env manually to be sure
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = os.path.join(BASE_DIR, 'backend', '.env')

from decouple import config, Csv

RPC_URL = config('SEPOLIA_RPC_URL')
PRIVATE_KEY = config('PRIVATE_KEY')
CONTRACT_ADDRESS = config('CONTRACT_ADDRESS')
CONTRACT_ABI = config('CONTRACT_ABI')

print(f"RPC: {RPC_URL[:20]}...")
print(f"Address: {CONTRACT_ADDRESS}")

try:
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print("❌ Failed to connect to Web3 Provider")
        sys.exit(1)
    print(f"✅ Connected to Web3. Block Number: {w3.eth.block_number}")

    account = w3.eth.account.from_key(PRIVATE_KEY)
    print(f"✅ Account: {account.address}")
    
    balance = w3.eth.get_balance(account.address)
    print(f"💰 Balance: {w3.from_wei(balance, 'ether')} ETH")

    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=json.loads(CONTRACT_ABI))
    print("✅ Contract Loaded")

    # TEST TRANSACTION
    print("\n🚀 Attempting Anchor Transaction...")
    nonce = w3.eth.get_transaction_count(account.address)
    
    tx = contract.functions.anchorEvent("DEBUG_TEST", "0x123456").build_transaction({
        'chainId': 11155111,
        'gas': 200000,
        'maxFeePerGas': w3.to_wei('50', 'gwei'), # Increased gas
        'maxPriorityFeePerGas': w3.to_wei('2', 'gwei'),
        'nonce': nonce,
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    
    # Try both attributes just in case
    try:
        raw = signed_tx.raw_transaction
    except:
        raw = signed_tx.rawTransaction

    tx_hash = w3.eth.send_raw_transaction(raw)
    print(f"✅ SUCCESS! TX Hash: {w3.to_hex(tx_hash)}")

except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"\n❌ ERROR: {e}")
