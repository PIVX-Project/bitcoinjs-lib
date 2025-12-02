/**
 * PIVX address encoding and decoding utilities.
 * 
 * This module provides support for PIVX's extended address formats, including
 * the 3-byte exchange address prefix. It maintains compatibility with standard
 * bitcoinjs-lib APIs while handling PIVX-specific multi-byte version prefixes.
 * 
 * @packageDocumentation
 */
import bs58check from 'bs58check';
import * as tools from 'uint8array-tools';
import * as bscript from '../script.js';
import {
  PivxNetwork,
  PivxAddressType,
  ParsedPivxAddress,
  VersionPrefix,
} from './types.js';

const OPS = bscript.OPS;

/**
 * Checks if two version prefixes are equal.
 * Handles both single-byte and multi-byte prefixes.
 * 
 * @param a - First version prefix
 * @param b - Second version prefix
 * @returns true if prefixes match, false otherwise
 */
function versionEquals(a: VersionPrefix, b: VersionPrefix): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }
  return false;
}

/**
 * Extracts the version prefix from a Base58Check-decoded payload.
 * Attempts to match against known PIVX prefixes, supporting both 1-byte and multi-byte versions.
 * 
 * @param payload - The decoded Base58Check payload
 * @param network - The PIVX network configuration
 * @returns Object containing the matched prefix and remaining hash
 * @throws {Error} If the payload is too short or contains an unknown prefix
 */
function extractVersion(
  payload: Uint8Array,
  network: PivxNetwork,
): { version: VersionPrefix; hash: Uint8Array; type: PivxAddressType } {
  const prefixes = network.pivxPrefixes;
  
  // Check 3-byte exchange prefix first (most specific)
  if (Array.isArray(prefixes.exchange) && payload.length >= prefixes.exchange.length + 20) {
    const prefixBytes = Array.from(payload.slice(0, prefixes.exchange.length));
    if (versionEquals(prefixBytes, prefixes.exchange)) {
      return {
        version: prefixes.exchange,
        hash: payload.slice(prefixes.exchange.length),
        type: 'exchange',
      };
    }
  }
  
  // Check 1-byte prefixes
  if (payload.length < 21) {
    throw new Error('Address payload too short');
  }
  
  const singleByteVersion = payload[0];
  const hash = payload.slice(1);
  
  // Check each prefix type
  if (
    typeof prefixes.pubKeyHash === 'number' &&
    singleByteVersion === prefixes.pubKeyHash
  ) {
    return { version: singleByteVersion, hash, type: 'p2pkh' };
  }
  
  if (
    typeof prefixes.scriptHash === 'number' &&
    singleByteVersion === prefixes.scriptHash
  ) {
    return { version: singleByteVersion, hash, type: 'p2sh' };
  }
  
  if (
    typeof prefixes.staking === 'number' &&
    singleByteVersion === prefixes.staking
  ) {
    return { version: singleByteVersion, hash, type: 'staking' };
  }
  
  throw new Error(
    `Unknown PIVX address prefix: 0x${singleByteVersion.toString(16).padStart(2, '0')}`,
  );
}

/**
 * Parses a PIVX Base58Check address string.
 * 
 * Supports all PIVX address types:
 * - P2PKH addresses (prefix 0x1e, start with 'D')
 * - P2SH addresses (prefix 0x0d)
 * - Staking addresses (prefix 0x3f, start with 'S')
 * - Exchange addresses (prefix [0x01, 0xb9, 0xa2], start with 'EX')
 * 
 * @param address - The PIVX address string to parse
 * @param network - The PIVX network configuration
 * @returns Parsed address information including type, version, and hash
 * @throws {Error} If the address has an invalid checksum or unknown prefix
 * 
 * @example
 * ```typescript
 * const parsed = parsePivxBase58Address('D...', pivxNetwork);
 * console.log(parsed.type); // 'p2pkh'
 * console.log(parsed.version); // 0x1e
 * 
 * const exchange = parsePivxBase58Address('EX...', pivxNetwork);
 * console.log(exchange.type); // 'exchange'
 * console.log(exchange.version); // [0x01, 0xb9, 0xa2]
 * ```
 */
export function parsePivxBase58Address(
  address: string,
  network: PivxNetwork,
): ParsedPivxAddress {
  // Decode the Base58Check address
  const payload = bs58check.decode(address);
  
  // Extract version and hash based on known prefixes
  const { version, hash, type } = extractVersion(payload, network);
  
  // Validate hash length (should be 20 bytes for standard addresses)
  if (hash.length !== 20) {
    throw new Error(
      `Invalid hash length: expected 20 bytes, got ${hash.length}`,
    );
  }
  
  return { type, version, hash };
}

/**
 * Encodes a hash into a PIVX Base58Check address with the specified version prefix.
 * 
 * @param hash - The hash to encode (must be 20 bytes)
 * @param version - The version prefix (single byte or multi-byte array)
 * @returns The Base58Check-encoded address string
 * @throws {Error} If the hash is not 20 bytes
 * 
 * @example
 * ```typescript
 * // Create a standard PIVX P2PKH address
 * const address = encodePivxAddress(hash, 0x1e);
 * 
 * // Create a PIVX exchange address
 * const exchangeAddr = encodePivxAddress(hash, [0x01, 0xb9, 0xa2]);
 * ```
 */
export function encodePivxAddress(
  hash: Uint8Array,
  version: VersionPrefix,
): string {
  if (hash.length !== 20) {
    throw new Error(`Hash must be 20 bytes, got ${hash.length}`);
  }
  
  let payload: Uint8Array;
  
  if (typeof version === 'number') {
    // Single-byte version prefix
    payload = new Uint8Array(21);
    tools.writeUInt8(payload, 0, version);
    payload.set(hash, 1);
  } else {
    // Multi-byte version prefix
    payload = new Uint8Array(version.length + hash.length);
    payload.set(version, 0);
    payload.set(hash, version.length);
  }
  
  return bs58check.encode(payload);
}

/**
 * Encodes a hash into a PIVX exchange address (EX-prefixed).
 * 
 * This is a convenience wrapper around encodePivxAddress specifically
 * for PIVX exchange addresses.
 * 
 * @param hash - The hash to encode (must be 20 bytes)
 * @param network - The PIVX network configuration
 * @returns The Base58Check-encoded exchange address string
 * 
 * @example
 * ```typescript
 * const exchangeAddr = encodePivxExchangeAddress(hash, pivxNetwork);
 * // Returns address starting with 'EX' or 'EXM'
 * ```
 */
export function encodePivxExchangeAddress(
  hash: Uint8Array,
  network: PivxNetwork,
): string {
  return encodePivxAddress(hash, network.pivxPrefixes.exchange);
}

/**
 * Encodes a hash into a PIVX staking address (S-prefixed).
 * 
 * @param hash - The hash to encode (must be 20 bytes)
 * @param network - The PIVX network configuration
 * @returns The Base58Check-encoded staking address string
 */
export function encodePivxStakingAddress(
  hash: Uint8Array,
  network: PivxNetwork,
): string {
  return encodePivxAddress(hash, network.pivxPrefixes.staking);
}

/**
 * Converts a PIVX address to its output script (scriptPubKey).
 * 
 * Supports all PIVX address types:
 * - P2PKH addresses (D-prefix): Standard P2PKH script
 * - P2SH addresses: Standard P2SH script
 * - Staking addresses (S-prefix): Standard P2PKH script (same as regular P2PKH)
 * - Exchange addresses (EX-prefix): OP_EXCHANGEADDR + P2PKH script
 * 
 * Note: PIVX exchange addresses use a special OP_EXCHANGEADDR (0xe0) opcode
 * at the beginning of the script to identify outputs that cannot receive
 * shielded (private) funds. The script format is:
 * OP_EXCHANGEADDR OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG
 * 
 * Reference: PIVX Core src/script/script.cpp - IsPayToExchangeAddress()
 * 
 * @param address - The PIVX address string to convert
 * @param network - The PIVX network configuration
 * @returns The output script (scriptPubKey) as Uint8Array
 * @throws {Error} If the address is invalid or has unknown prefix
 * 
 * @example
 * ```typescript
 * // Exchange address (special OP_EXCHANGEADDR opcode)
 * const script = pivxAddressToOutputScript('EX...', pivx);
 * // Returns: OP_EXCHANGEADDR OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG
 * // (26 bytes total)
 * 
 * // Staking address (standard P2PKH)
 * const script2 = pivxAddressToOutputScript('S...', pivx);
 * // Returns: OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG
 * // (25 bytes)
 * 
 * // Regular P2PKH
 * const script3 = pivxAddressToOutputScript('D...', pivx);
 * // Returns: OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG
 * // (25 bytes)
 * 
 * // P2SH
 * const script4 = pivxAddressToOutputScript('6G...', pivx);
 * // Returns: OP_HASH160 <hash> OP_EQUAL
 * // (23 bytes)
 * ```
 */
export function pivxAddressToOutputScript(
  address: string,
  network: PivxNetwork,
): Uint8Array {
  const parsed = parsePivxBase58Address(address, network);
  
  switch (parsed.type) {
    case 'p2pkh':
    case 'staking':
      // Standard P2PKH output script:
      // OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG
      return bscript.compile([
        OPS.OP_DUP,
        OPS.OP_HASH160,
        parsed.hash,
        OPS.OP_EQUALVERIFY,
        OPS.OP_CHECKSIG,
      ]);
    
    case 'exchange':
      // Exchange address output script (PIVX-specific):
      // OP_EXCHANGEADDR OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG
      // OP_EXCHANGEADDR = 0xe0 (224 decimal)
      // This prevents shielded (private) funds from being sent to exchange addresses
      return bscript.compile([
        0xe0, // OP_EXCHANGEADDR
        OPS.OP_DUP,
        OPS.OP_HASH160,
        parsed.hash,
        OPS.OP_EQUALVERIFY,
        OPS.OP_CHECKSIG,
      ]);
    
    case 'p2sh':
      // P2SH output script:
      // OP_HASH160 <hash> OP_EQUAL
      return bscript.compile([
        OPS.OP_HASH160,
        parsed.hash,
        OPS.OP_EQUAL,
      ]);
    
    default:
      throw new Error(`Unknown PIVX address type: ${parsed.type}`);
  }
}

/**
 * Alias for pivxAddressToOutputScript for consistency with bitcoinjs-lib naming.
 * @see pivxAddressToOutputScript
 */
export function toOutputScript(
  address: string,
  network: PivxNetwork,
): Uint8Array {
  return pivxAddressToOutputScript(address, network);
}
