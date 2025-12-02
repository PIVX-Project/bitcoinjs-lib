/**
 * PIVX network configuration.
 * 
 * Defines the PIVX mainnet network parameters compatible with PIVX Core.
 * 
 * @packageDocumentation
 */
import { PivxNetwork } from './types.js';

/**
 * PIVX mainnet network configuration.
 * 
 * Base58 prefixes from PIVX Core:
 * - PUBKEY_ADDRESS: 0x1E (30) → addresses start with 'D'
 * - SCRIPT_ADDRESS: 0x0D (13) → P2SH addresses
 * - STAKING_ADDRESS: 0x3F (63) → addresses start with 'S'
 * - EXCHANGE_ADDRESS: [0x01, 0xB9, 0xA2] → addresses start with 'EX' or 'EXM'
 * - SECRET_KEY: 0xD4 (212) → WIF private keys
 * 
 * @example
 * ```typescript
 * import { pivx, parsePivxBase58Address } from 'bitcoinjs-lib/pivx';
 * 
 * const parsed = parsePivxBase58Address('D...', pivx);
 * ```
 */
export const pivx: PivxNetwork = {
  messagePrefix: '\x18Darknet Signed Message:\n',
  bech32: '', // PIVX doesn't use bech32 currently
  bip32: {
    public: 0x022d2533,  // 'xpub' equivalent for PIVX
    private: 0x0221312b, // 'xprv' equivalent for PIVX
  },
  pubKeyHash: 0x1e, // Standard P2PKH prefix (for compatibility)
  scriptHash: 0x0d, // Standard P2SH prefix (for compatibility)
  wif: 0xd4,        // WIF private key prefix
  
  // PIVX-specific extended prefixes
  pivxPrefixes: {
    pubKeyHash: 0x1e,              // 'D' addresses
    scriptHash: 0x0d,              // P2SH addresses
    staking: 0x3f,                 // 'S' addresses
    exchange: [0x01, 0xb9, 0xa2],  // 'EX' / 'EXM' addresses (3-byte prefix)
  },
};
