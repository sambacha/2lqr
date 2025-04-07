# Planning Prompt for Dual-Layer QR Code (2LQR) Implementation

## Project Overview

Your task is to develop a proof of concept implementation of a Dual-Layer QR Code (2LQR) system based on the technical specifications provided. This system encodes both public and private messages simultaneously in a single QR code through textured pattern substitution and cryptographic techniques.

## Objectives

1. Analyze and refactor an existing QR code library to support dual-layer encoding/decoding
2. Implement the three key components: public channel encoding, private channel encoding, and integration layer
3. Create a functional demonstration that generates and reads 2LQR codes
4. Ensure backward compatibility with standard QR readers for the public message

## Technical Specifications

### System Parameters
- Public message (M_pub): Standard QR content readable by any scanner
- Private message (M_priv): Hidden content requiring specialized decoding
- q = 8 distinct textured patterns (P = {P₁, P₂, ..., P₈})
- Each pattern encodes log₂(8) = 3 bits of information
- Cryptographic key (K) for private message scrambling

### Architecture Components

1. **Public Channel Module**
   - Leverage the existing QR library for standard encoding
   - Track black module positions for potential replacement (set B)
   - Preserve critical structures (finder patterns, alignment patterns, timing patterns)

2. **Private Channel Module**
   - Implement q-ary representation for M_priv
   - Develop Reed-Solomon error correction coding over GF(q^m)
   - Implement cryptographic scrambling with permutation and XOR operations

3. **Integration Layer**
   - Create a module replacement strategy
   - Implement pattern selection algorithm
   - Ensure readability constraints are maintained

## Implementation Approach

1. Begin by selecting an open-source QR code library with clear architecture
2. Analyze the codebase to identify:
   - QR code generation pipeline
   - Module placement mechanisms
   - Error correction implementation
   - Data encoding/decoding processes

3. Design extensions for:
   - Pattern generation and storage
   - Black module selection and replacement
   - Cryptographic operations
   - Reed-Solomon over arbitrary fields

4. Implement core mathematical functions:
   - q-ary conversion
   - Reed-Solomon encoding/decoding
   - Key expansion and permutation
   - Pattern distance metrics

## Development Roadmap

### Phase 1: Library Analysis and Framework Setup
1. Select and analyze QR library
2. Create extension points without modifying core functionality
3. Design pattern generation subsystem
4. Implement module tracking during QR generation

### Phase 2: Implement Private Channel
1. Develop q-ary conversion for M_priv
2. Implement Reed-Solomon coding
3. Create cryptographic scrambling functions
4. Design pattern selection algorithm

### Phase 3: Integration Layer
1. Implement module replacement strategy
2. Create pattern rendering subsystem
3. Enforce security and readability constraints
4. Build integration pipeline

### Phase 4: Decoding Implementation
1. Develop pattern recognition algorithm
2. Implement descrambling process
3. Add private message recovery
4. Create full decoding pipeline

## Testing Strategy
1. Unit tests for mathematical operations
2. Component tests for each module
3. Integration tests for full pipeline
4. Verification with standard QR readers
5. Security validation for private channel

## Technical Considerations
1. Select patterns that maintain public readability
2. Optimize pattern recognition reliability
3. Balance between capacity, security, and readability
4. Consider computational efficiency for mobile applications

## Deliverables
1. Modified QR library with 2LQR capabilities
2. Encoding/decoding APIs
3. Command-line tools for demonstration
4. Documentation and examples

Use this planning prompt to guide your implementation of a proof-of-concept 2LQR system by refactoring an existing QR code library.