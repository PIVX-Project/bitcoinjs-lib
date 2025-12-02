/**
 * PIVX Address Usage Examples
 * 
 * This file demonstrates how to use the PIVX address support in bitcoinjs-lib.
 */

import {
  pivx,
  parsePivxBase58Address,
  encodePivxAddress,
  encodePivxExchangeAddress,
  encodePivxStakingAddress,
} from 'bitcoinjs-lib/pivx';
import * as tools from 'uint8array-tools';

// ============================================================================
// Example 1: Parse different types of PIVX addresses
// ============================================================================

console.log('=== Example 1: Parsing PIVX Addresses ===\n');

// Create test hashes for demonstration
const testHash = tools.fromHex('1234567890abcdef1234567890abcdef12345678');

// Create example addresses
const addresses = {
  p2pkh: encodePivxAddress(testHash, 0x1e),
  p2sh: encodePivxAddress(testHash, 0x0d),
  staking: encodePivxStakingAddress(testHash, pivx),
  exchange: encodePivxExchangeAddress(testHash, pivx),
};

console.log('Example addresses:');
console.log(`  P2PKH:    ${addresses.p2pkh} (starts with D)`);
console.log(`  P2SH:     ${addresses.p2sh}`);
console.log(`  Staking:  ${addresses.staking} (starts with S)`);
console.log(`  Exchange: ${addresses.exchange} (starts with EX)\n`);

// Parse each address
Object.entries(addresses).forEach(([type, address]) => {
  const parsed = parsePivxBase58Address(address, pivx);
  console.log(`Parsed ${type}:`);
  console.log(`  Type:    ${parsed.type}`);
  console.log(`  Version: ${Array.isArray(parsed.version) ? `[${parsed.version.join(', ')}]` : `0x${parsed.version.toString(16)}`}`);
  console.log(`  Hash:    ${tools.toHex(parsed.hash)}\n`);
});

// ============================================================================
// Example 2: Creating PIVX addresses from public key hash
// ============================================================================

console.log('=== Example 2: Creating Addresses from Hash ===\n');

// Simulate a public key hash (in reality, this would come from hashing a public key)
const pubKeyHash = new Uint8Array(20);
for (let i = 0; i < 20; i++) {
  pubKeyHash[i] = i * 10;
}

console.log(`Public key hash: ${tools.toHex(pubKeyHash)}\n`);

// Create different address types from the same hash
const p2pkhAddress = encodePivxAddress(pubKeyHash, pivx.pivxPrefixes.pubKeyHash);
const stakingAddress = encodePivxStakingAddress(pubKeyHash, pivx);
const exchangeAddress = encodePivxExchangeAddress(pubKeyHash, pivx);

console.log('Addresses from same hash:');
console.log(`  P2PKH:    ${p2pkhAddress}`);
console.log(`  Staking:  ${stakingAddress}`);
console.log(`  Exchange: ${exchangeAddress}\n`);

// ============================================================================
// Example 3: Address validation and classification
// ============================================================================

console.log('=== Example 3: Address Validation ===\n');

function validateAndClassifyPivxAddress(address: string): void {
  try {
    const parsed = parsePivxBase58Address(address, pivx);
    console.log(`✓ Valid ${parsed.type.toUpperCase()} address`);
    console.log(`  Address:  ${address}`);
    console.log(`  Type:     ${parsed.type}`);
    console.log(`  Hash:     ${tools.toHex(parsed.hash)}`);
    
    // Show version format
    if (Array.isArray(parsed.version)) {
      console.log(`  Version:  [${parsed.version.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}] (multi-byte)`);
    } else {
      console.log(`  Version:  0x${parsed.version.toString(16).padStart(2, '0')} (single-byte)`);
    }
  } catch (error) {
    console.log(`✗ Invalid address: ${address}`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log();
}

// Test with valid addresses
validateAndClassifyPivxAddress(p2pkhAddress);
validateAndClassifyPivxAddress(exchangeAddress);

// Test with invalid addresses
validateAndClassifyPivxAddress('InvalidAddress123');
validateAndClassifyPivxAddress('1BitcoinAddress'); // Bitcoin address

// ============================================================================
// Example 4: Round-trip encoding/decoding
// ============================================================================

console.log('=== Example 4: Round-trip Verification ===\n');

function testRoundTrip(description: string, hash: Uint8Array, version: number | number[]): void {
  console.log(`${description}:`);
  
  // Encode
  const address = encodePivxAddress(hash, version);
  console.log(`  Encoded:  ${address}`);
  
  // Decode
  const parsed = parsePivxBase58Address(address, pivx);
  console.log(`  Decoded type: ${parsed.type}`);
  
  // Verify
  const hashesMatch = tools.compare(hash, parsed.hash) === 0;
  console.log(`  Hashes match: ${hashesMatch ? '✓' : '✗'}`);
  
  if (!hashesMatch) {
    console.log(`    Original: ${tools.toHex(hash)}`);
    console.log(`    Decoded:  ${tools.toHex(parsed.hash)}`);
  }
  console.log();
}

testRoundTrip('P2PKH', testHash, 0x1e);
testRoundTrip('Staking', testHash, 0x3f);
testRoundTrip('Exchange', testHash, [0x01, 0xb9, 0xa2]);

// ============================================================================
// Example 5: Working with edge cases
// ============================================================================

console.log('=== Example 5: Edge Cases ===\n');

// All-zero hash
const zeroHash = new Uint8Array(20);
const zeroAddr = encodePivxAddress(zeroHash, 0x1e);
console.log(`All-zero hash address: ${zeroAddr}`);
const parsedZero = parsePivxBase58Address(zeroAddr, pivx);
console.log(`  Parsed successfully: ${parsedZero.type === 'p2pkh' ? '✓' : '✗'}\n`);

// All-ones hash
const onesHash = new Uint8Array(20).fill(0xff);
const onesAddr = encodePivxAddress(onesHash, 0x1e);
console.log(`All-ones hash address: ${onesAddr}`);
const parsedOnes = parsePivxBase58Address(onesAddr, pivx);
console.log(`  Parsed successfully: ${parsedOnes.type === 'p2pkh' ? '✓' : '✗'}\n`);

// ============================================================================
// Example 6: Batch processing addresses
// ============================================================================

console.log('=== Example 6: Batch Processing ===\n');

const addressesToProcess = [
  p2pkhAddress,
  stakingAddress,
  exchangeAddress,
];

const statistics = {
  p2pkh: 0,
  p2sh: 0,
  staking: 0,
  exchange: 0,
  invalid: 0,
};

addressesToProcess.forEach(addr => {
  try {
    const parsed = parsePivxBase58Address(addr, pivx);
    statistics[parsed.type]++;
  } catch {
    statistics.invalid++;
  }
});

console.log('Address statistics:');
console.log(`  P2PKH:    ${statistics.p2pkh}`);
console.log(`  P2SH:     ${statistics.p2sh}`);
console.log(`  Staking:  ${statistics.staking}`);
console.log(`  Exchange: ${statistics.exchange}`);
console.log(`  Invalid:  ${statistics.invalid}\n`);

// ============================================================================
// Example 7: Error handling
// ============================================================================

console.log('=== Example 7: Error Handling ===\n');

// Test invalid hash length
try {
  const shortHash = new Uint8Array(10); // Should be 20 bytes
  encodePivxAddress(shortHash, 0x1e);
  console.log('✗ Should have thrown an error for short hash');
} catch (error) {
  console.log(`✓ Caught expected error: ${error instanceof Error ? error.message : String(error)}`);
}

// Test invalid checksum
try {
  parsePivxBase58Address('D1234InvalidChecksum', pivx);
  console.log('✗ Should have thrown an error for invalid checksum');
} catch (error) {
  console.log(`✓ Caught expected error: ${error instanceof Error ? error.message : String(error)}`);
}

console.log('\n=== Examples Complete ===');

// ============================================================================
// Export for use in other modules
// ============================================================================

export {
  addresses,
  validateAndClassifyPivxAddress,
  testRoundTrip,
};
