---
title: CSAPP Lab 1 - Bit Operations Solutions
data:date: 2026-02-09 23:15:43
tags: [CSAPP, Systems Programming, C, Bit Manipulation]
categories: [CSAPP]
mathjax: true
---

## Overview

This post documents my solutions to the **Bit Operations** lab from *Computer Systems: A Programmer's Perspective* (CSAPP). The lab constraints are strict: only bitwise operators `! ~ & ^ | + << >>` are allowed, along with constants `0-255`. No control flow, no macros, no function calls.

## Solutions & Analysis

### 1. isAsciiDigit

**Task:** Return 1 if `0x30 <= x <= 0x39` (ASCII '0' to '9').

**Key Insight:** Without comparison operators, we use subtraction via two's complement (`~x + 1 == -x`) and check the sign bit.

```c
int isAsciiDigit(int x) {
    int a = (x + ~0x30 + 1) >> 31;  // x - 0x30, sign bit extraction
    int b = (x + ~0x3A + 1) >> 31;  // x - 0x3A, sign bit extraction
    return (!a) & (!!b);
}
```
**Explanation:**
* a checks if x >= 0x30: if x - 0x30 >= 0, sign bit is 0, !a becomes 1
* b checks if x < 0x3A (we use 0x3A instead of 0x39 to distinguish boundary): if x - 0x3A < 0, sign bit is 1, !!b becomes 1
* Final & ensures both conditions hold

### 2. anyEvenBit
**Task:** Return 1 if any even-numbered bit (0, 2, 4, ..., 30) is set to 1.

**Key Insight:** Mask 0x55 (binary 01010101) isolates even bits. We check all 4 bytes separately and aggregate.

```c
int anyEvenBit(int x) {
    int mask = 0x55;                    // 01010101 - even bit selector
    int byte0 = x & mask;
    int byte1 = (x >> 8) & mask;
    int byte2 = (x >> 16) & mask;
    int byte3 = (x >> 24) & mask;
    int sum = byte0 + byte1 + byte2 + byte3;
    return !!(sum);                     // double negation to normalize to 0/1
}
```
**Explanation:**
* 0x55 selects bits 0, 2, 4, 6 in each byte
* Right-shifting extracts each byte's even bits
* If any even bit is set anywhere, sum != 0, and !! converts non-zero to 1

### 3. copyLSB
**Task:** Set all bits of result to the least significant bit of x.

**Key Insight:** Arithmetic right shift replicates the sign bit. Isolate LSB, shift left to MSB, then shift right back to fill all bits.

```c
int copyLSB(int x) {
    return (x << 31) >> 31;
}
```

**Explanation:**
* x << 31 moves bit 0 to bit 31 (sign bit position), clearing all lower bits
* Arithmetic right shift >> 31 replicates the sign bit across all 32 bits
* Result: 0xFFFFFFFF if LSB was 1, 0x00000000 if 0

### 4. leastBitPos
**Task:** Return a mask marking the position of the least significant 1 bit. Return 0 if x == 0.
**Key Insight:** x & (-x) isolates the lowest set bit due to two's complement properties.

```c
int leastBitPos(int x) {
    return x & (~x + 1);
}
```

**Explanation:**
* ~x + 1 computes -x (two's complement negation)
* In -x, all bits below the lowest set bit in x become 1, the lowest set bit stays 1, and bits above flip
* ANDing x with -x cancels all but the lowest set bit
* Example: x = 96 (0x60), -x = 0xFFFFFFA0, x & (-x) = 0x20

### 5. divpwr2
**Task:** Compute x / (2^n) with rounding toward zero. Handle negative numbers correctly.
**Key Insight:** C's right shift rounds toward negative infinity. For negative x not divisible by 2^n, we need a bias of +1.

```c
int divpwr2(int x, int n) {
    int sign = x >> 31;                          // -1 if negative, 0 if positive
    int mask = (~0 << n) ^ ~0;                   // low n bits set to 1
    int notDivisible = !!(x & mask);             // 1 if remainder exists
    int bias = sign & notDivisible;              // add 1 only if negative and not divisible
    return (x >> n) + bias;
}
```

**Explanation:**
* sign extracts sign bit (all 1s if negative, all 0s if positive)
* mask creates n low bits of 1s to test divisibility
* notDivisible checks if any lower bits are set (remainder exists)
* bias applies the +1 correction only when both conditions met
* Example: -33 / 16: -33 >> 4 = -3 (rounds toward -inf), but we need -2, so bias = 1

### 6. bitCount
**Task:** Count the number of 1 bits in x (population count).
**Key Insight:** Divide and conquer. Count bits in pairs, then sum pairs into nibbles, bytes, etc. - parallel bit counting.

```c
int bitCount(int x) {
    // Construct masks for different bit widths
    int mask2 = 0x55 | (0x55 << 8);
    mask2 = mask2 | (mask2 << 16);       // 0x55555555 - 2-bit counters
    
    int mask4 = 0x33 | (0x33 << 8);
    mask4 = mask4 | (mask4 << 16);       // 0x33333333 - 4-bit counters
    
    int mask8 = 0x0F | (0x0F << 8);
    mask8 = mask8 | (mask8 << 16);       // 0x0F0F0F0F - 8-bit counters
    
    int mask16 = 0xFF | (0xFF << 16);    // 0x00FF00FF - 16-bit counters
    int mask32 = 0xFF | (0xFF << 8);     // 0x0000FFFF - 32-bit counter
    
    // Parallel summation: sum adjacent bit fields
    x = (x & mask2) + ((x >> 1) & mask2);    // Count bits in each 2-bit field
    x = (x & mask4) + ((x >> 2) & mask4);    // Sum to 4-bit fields
    x = (x & mask8) + ((x >> 4) & mask8);    // Sum to 8-bit fields
    x = (x & mask16) + ((x >> 8) & mask16);  // Sum to 16-bit fields
    x = (x & mask32) + ((x >> 16) & mask32); // Sum to 32-bit field (final count)
    
    return x;
}
```

**Explanation:**
* Phase 1: Each 2-bit field holds count of 1s in original 2 bits (max value 2)
* Phase 2: Sum adjacent 2-bit fields into 4-bit fields (max value 4)
* Phase 3-5: Continue doubling field width until entire count fits in 32 bits
* This is essentially a parallel reduction algorithm implemented with bit masks

## Key Takeaways
**Constraints breed creativity:** Limited to basic bitwise ops, you rediscover fundamental properties of two's complement arithmetic
**Mask construction:** Without loading arbitrary constants, you build masks through shifts and ORs (e.g., 0x55 → 0x55555555)
**Algorithmic patterns transfer:** Divide-and-conquer works for bit manipulation just as it does for general algorithms
**Performance implications:** Bit manipulation solutions are O(1) with very low constant factors - useful in systems programming

*Disclaimer:* 
Part of the solution refers to the answers of [TJU Course Sharing](https://cs.tjuse.com/zh-CN/), and uses the assistance of the large model tool in the process of organizing the analysis.
The analysis is for reference only and cannot be copied.