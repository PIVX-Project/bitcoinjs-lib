import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as tools from 'uint8array-tools';
import bs58check from 'bs58check';
import {
  pivx,
  parsePivxBase58Address,
  encodePivxAddress,
  encodePivxExchangeAddress,
  encodePivxStakingAddress,
} from 'bitcoinjs-lib/pivx';

describe('PIVX Address Support', () => {
  describe('parsePivxBase58Address', () => {
    it('should parse a standard PIVX P2PKH address (D-prefix)', () => {
      // Example PIVX P2PKH address (D-prefix)
      // This is a test vector in production you'd use real PIVX addresses
      const hash = new Uint8Array(20);
      hash.fill(0x12); // Dummy hash for testing
      
      const address = encodePivxAddress(hash, 0x1e);
      assert.ok(address.startsWith('D'), 'P2PKH address should start with D');
      
      const parsed = parsePivxBase58Address(address, pivx);
      assert.strictEqual(parsed.type, 'p2pkh');
      assert.strictEqual(parsed.version, 0x1e);
      assert.deepStrictEqual(parsed.hash, hash);
    });
    
    it('should parse a PIVX P2SH address', () => {
      const hash = new Uint8Array(20);
      hash.fill(0x34);
      
      const address = encodePivxAddress(hash, 0x0d);
      const parsed = parsePivxBase58Address(address, pivx);
      
      assert.strictEqual(parsed.type, 'p2sh');
      assert.strictEqual(parsed.version, 0x0d);
      assert.deepStrictEqual(parsed.hash, hash);
    });
    
    it('should parse a PIVX staking address (S-prefix)', () => {
      const hash = new Uint8Array(20);
      hash.fill(0x56);
      
      const address = encodePivxStakingAddress(hash, pivx);
      assert.ok(address.startsWith('S'), 'Staking address should start with S');
      
      const parsed = parsePivxBase58Address(address, pivx);
      assert.strictEqual(parsed.type, 'staking');
      assert.strictEqual(parsed.version, 0x3f);
      assert.deepStrictEqual(parsed.hash, hash);
    });
    
    it('should parse a PIVX exchange address (EX-prefix, 3-byte version)', () => {
      const hash = new Uint8Array(20);
      hash.fill(0x78);
      
      const address = encodePivxExchangeAddress(hash, pivx);
      assert.ok(
        address.startsWith('EX'),
        'Exchange address should start with EX',
      );
      
      const parsed = parsePivxBase58Address(address, pivx);
      assert.strictEqual(parsed.type, 'exchange');
      assert.deepStrictEqual(parsed.version, [0x01, 0xb9, 0xa2]);
      assert.deepStrictEqual(parsed.hash, hash);
    });
    
    it('should throw on unknown prefix', () => {
      // Create an address with an invalid PIVX prefix
      const hash = new Uint8Array(20);
      hash.fill(0xaa);
      const address = encodePivxAddress(hash, 0xff); // Invalid prefix
      
      assert.throws(
        () => parsePivxBase58Address(address, pivx),
        /Unknown PIVX address prefix/,
      );
    });
    
    it('should throw on invalid checksum', () => {
      assert.throws(
        () => parsePivxBase58Address('InvalidBase58!@#', pivx),
        /Invalid checksum|Non-base58 character/,
      );
    });
    
    it('should throw on invalid hash length', () => {
      // Create address with wrong hash length
      const shortHash = new Uint8Array(10); // Should be 20 bytes
      const payload = new Uint8Array(11);
      payload[0] = 0x1e;
      payload.set(shortHash, 1);
      
      // We need to manually encode to bypass the length check in encodePivxAddress
      const invalidAddress = bs58check.encode(payload);
      
      assert.throws(
        () => parsePivxBase58Address(invalidAddress, pivx),
        /Invalid hash length|Address payload too short/,
      );
    });
  });
  
  describe('encodePivxAddress', () => {
    it('should encode with single-byte version prefix', () => {
      const hash = tools.fromHex('1234567890abcdef1234567890abcdef12345678');
      const address = encodePivxAddress(hash, 0x1e);
      
      assert.ok(typeof address === 'string');
      assert.ok(address.length > 20);
      
      // Verify round-trip
      const parsed = parsePivxBase58Address(address, pivx);
      assert.deepStrictEqual(parsed.hash, hash);
      assert.strictEqual(parsed.version, 0x1e);
    });
    
    it('should encode with multi-byte version prefix', () => {
      const hash = tools.fromHex('fedcba0987654321fedcba0987654321fedcba09');
      const address = encodePivxAddress(hash, [0x01, 0xb9, 0xa2]);
      
      assert.ok(typeof address === 'string');
      
      // Verify round-trip
      const parsed = parsePivxBase58Address(address, pivx);
      assert.deepStrictEqual(parsed.hash, hash);
      assert.deepStrictEqual(parsed.version, [0x01, 0xb9, 0xa2]);
    });
    
    it('should throw on invalid hash length', () => {
      const shortHash = new Uint8Array(10);
      assert.throws(
        () => encodePivxAddress(shortHash, 0x1e),
        /Hash must be 20 bytes/,
      );
      
      const longHash = new Uint8Array(30);
      assert.throws(
        () => encodePivxAddress(longHash, 0x1e),
        /Hash must be 20 bytes/,
      );
    });
  });
  
  describe('encodePivxExchangeAddress', () => {
    it('should create exchange address with correct prefix', () => {
      const hash = new Uint8Array(20);
      hash.fill(0x99);
      
      const address = encodePivxExchangeAddress(hash, pivx);
      assert.ok(address.startsWith('EX'));
      
      const parsed = parsePivxBase58Address(address, pivx);
      assert.strictEqual(parsed.type, 'exchange');
      assert.deepStrictEqual(parsed.hash, hash);
    });
  });
  
  describe('encodePivxStakingAddress', () => {
    it('should create staking address with correct prefix', () => {
      const hash = new Uint8Array(20);
      hash.fill(0xbb);
      
      const address = encodePivxStakingAddress(hash, pivx);
      assert.ok(address.startsWith('S'));
      
      const parsed = parsePivxBase58Address(address, pivx);
      assert.strictEqual(parsed.type, 'staking');
      assert.deepStrictEqual(parsed.hash, hash);
    });
  });
  
  describe('Real-world test vectors', () => {
    // These test vectors can be generated using PIVX Core wallet
    // For now, we use constructed examples
    
    it('should handle multiple different hashes correctly', () => {
      const hashes = [
        tools.fromHex('0000000000000000000000000000000000000000'),
        tools.fromHex('ffffffffffffffffffffffffffffffffffffffff'),
        tools.fromHex('1111111111111111111111111111111111111111'),
        tools.fromHex('89abcdef0123456789abcdef0123456789abcdef'),
      ];
      
      hashes.forEach(hash => {
        // Test P2PKH
        const p2pkhAddr = encodePivxAddress(hash, 0x1e);
        const p2pkhParsed = parsePivxBase58Address(p2pkhAddr, pivx);
        assert.strictEqual(p2pkhParsed.type, 'p2pkh');
        assert.deepStrictEqual(p2pkhParsed.hash, hash);
        
        // Test exchange
        const exAddr = encodePivxExchangeAddress(hash, pivx);
        const exParsed = parsePivxBase58Address(exAddr, pivx);
        assert.strictEqual(exParsed.type, 'exchange');
        assert.deepStrictEqual(exParsed.hash, hash);
        
        // Test staking
        const stakingAddr = encodePivxStakingAddress(hash, pivx);
        const stakingParsed = parsePivxBase58Address(stakingAddr, pivx);
        assert.strictEqual(stakingParsed.type, 'staking');
        assert.deepStrictEqual(stakingParsed.hash, hash);
      });
    });
  });
  
  describe('Edge cases', () => {
    it('should handle all-zero hash', () => {
      const hash = new Uint8Array(20); // All zeros
      const address = encodePivxAddress(hash, 0x1e);
      const parsed = parsePivxBase58Address(address, pivx);
      
      assert.deepStrictEqual(parsed.hash, hash);
    });
    
    it('should handle all-ones hash', () => {
      const hash = new Uint8Array(20);
      hash.fill(0xff);
      const address = encodePivxAddress(hash, 0x1e);
      const parsed = parsePivxBase58Address(address, pivx);
      
      assert.deepStrictEqual(parsed.hash, hash);
    });
    
    it('should differentiate between address types with same hash', () => {
      const hash = new Uint8Array(20);
      hash.fill(0x42);
      
      const p2pkhAddr = encodePivxAddress(hash, 0x1e);
      const p2shAddr = encodePivxAddress(hash, 0x0d);
      const stakingAddr = encodePivxStakingAddress(hash, pivx);
      const exchangeAddr = encodePivxExchangeAddress(hash, pivx);
      
      // All addresses should be different
      assert.notStrictEqual(p2pkhAddr, p2shAddr);
      assert.notStrictEqual(p2pkhAddr, stakingAddr);
      assert.notStrictEqual(p2pkhAddr, exchangeAddr);
      assert.notStrictEqual(p2shAddr, stakingAddr);
      assert.notStrictEqual(p2shAddr, exchangeAddr);
      assert.notStrictEqual(stakingAddr, exchangeAddr);
      
      // But they should all decode to the same hash
      assert.deepStrictEqual(
        parsePivxBase58Address(p2pkhAddr, pivx).hash,
        hash,
      );
      assert.deepStrictEqual(parsePivxBase58Address(p2shAddr, pivx).hash, hash);
      assert.deepStrictEqual(
        parsePivxBase58Address(stakingAddr, pivx).hash,
        hash,
      );
      assert.deepStrictEqual(
        parsePivxBase58Address(exchangeAddr, pivx).hash,
        hash,
      );
    });
  });
});
