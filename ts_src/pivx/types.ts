/**
 * Extended network configuration for PIVX and other networks with multi-byte address prefixes.
 * 
 * @packageDocumentation
 */
import { Network } from '../networks.js';

/**
 * Represents a version prefix that can be either a single byte or multiple bytes.
 * - Single byte: standard Bitcoin-style prefix (e.g., 0x1e for PIVX P2PKH)
 * - Multiple bytes: extended prefix (e.g., [0x01, 0xb9, 0xa2] for PIVX exchange addresses)
 */
export type VersionPrefix = number | number[];

/**
 * Extended prefixes for PIVX-specific address types.
 */
export interface PivxPrefixes {
  /** Standard P2PKH prefix (0x1e) - addresses start with 'D' */
  pubKeyHash: VersionPrefix;
  /** Standard P2SH prefix (0x0d) */
  scriptHash: VersionPrefix;
  /** Staking address prefix (0x3f) - addresses start with 'S' */
  staking: VersionPrefix;
  /** Exchange address prefix ([0x01, 0xb9, 0xa2]) - addresses start with 'EXM' */
  exchange: VersionPrefix;
}

/**
 * Extended network interface for PIVX that includes both standard Bitcoin-compatible
 * fields and PIVX-specific multi-byte prefixes.
 */
export interface PivxNetwork extends Network {
  /** Extended address prefixes for PIVX */
  pivxPrefixes: PivxPrefixes;
}

/**
 * PIVX address type enumeration.
 */
export type PivxAddressType = 'p2pkh' | 'p2sh' | 'staking' | 'exchange';

/**
 * Result of parsing a PIVX Base58 address.
 */
export interface ParsedPivxAddress {
  /** The type of PIVX address */
  type: PivxAddressType;
  /** The version prefix (single byte or multi-byte array) */
  version: VersionPrefix;
  /** The address hash (typically 20 bytes) */
  hash: Uint8Array;
}
