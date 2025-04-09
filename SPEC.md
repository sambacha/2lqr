# Mathematical Specification for Two-Layer QR (2LQR) Code Encoding Process

## 1. Notation and Definitions

Let:
- $M_{\mathrm{pub}}$ be the public message to be encoded
- $M_{\mathrm{priv}}$ be the private message to be encoded
- $V \in \mathbb{N}$ be the QR code version (determines dimensions and capacity)
- $E \in \{\mathrm{L}, \mathrm{M}, \mathrm{Q}, \mathrm{H}\}$ be the error correction level
- $S$ be the module size (physical dimension of each QR module)
- $P = \{P_1, P_2, \ldots, P_q\}$ be a set of $q$ distinct textured patterns
- $K$ be the cryptographic key for private message scrambling
- $\mathcal{B}$ be the set of black modules in the standard QR code
- $q = |P| = 8$ be the number of distinct patterns

## 2. Public Channel Encoding

### 2.1 Standard QR Code Generation

The public message $M_{\mathrm{pub}}$ is encoded according to the QR code standard:

1. **Character encoding:** Convert $M_{\mathrm{pub}}$ into a bit stream $B_{\mathrm{pub}}$ using the chosen encoding mode $\mu \in \{\text{numeric}, \text{alphanumeric}, \text{byte}, \text{kanji}\}$.

2. **Mode indicator:** Let $\lambda(\mu)$ be the mode indicator for mode $\mu$.

3. **Character count indication:** Let $|M_{\mathrm{pub}}|_\mu$ be the character count in mode $\mu$, and let $c(V, \mu)$ be the character count indicator length. Form the indicator as the $c(V, \mu)$-bit binary representation of $|M_{\mathrm{pub}}|_\mu$.

4. **Data encoding:** Encode each character of $M_{\mathrm{pub}}$ to its binary representation, concatenating to form the data bit stream $D_{\mathrm{pub}}$.

5. **Error correction coding:** Divide $D_{\mathrm{pub}}$ into blocks per version $V$ and level $E$, compute Reed–Solomon codewords, and let $C_{\mathrm{pub}}$ be the concatenation of data and error correction codewords.

6. **Module placement:** Construct the QR matrix $Q \in \{0, 1\}^{n \times n}$ with $n = 17 + 4V$, place finder patterns, alignment patterns, timing patterns, and format information, then map the bits of $C_{\mathrm{pub}}$ to data modules. Define
   
   $$\mathcal{B} = \{(i, j) : Q_{i,j} = 1\}$$

7. **Mask selection:** Choose the mask pattern that minimizes the penalty score, apply it to obtain the final matrix $Q'$, and update $\mathcal{B}$ accordingly.

## 3. Private Channel Encoding

### 3.1 Pattern Selection and ECC Encoding

1. **$q$-ary representation:** Convert $M_{\mathrm{priv}}$ into a sequence $D_{\mathrm{priv}} = (d_1, \ldots, d_\ell)$ with $d_i \in \{0, \ldots, q-1\}$, where

   $$\ell \leq \left\lfloor\frac{|\mathcal{B}|}{k}\right\rfloor$$

   and $k$ is the ECC expansion factor.

2. **Reed–Solomon $q$-ary ECC:** Let $\mathrm{RS}_q(n, k)$ be a Reed–Solomon code over $\mathrm{GF}(q^m)$ with $q^m > \max\{n, q\}$. Compute the generator polynomial

   $$g(x) = \prod_{i=1}^{n-k}(x - \alpha^i)$$

   where $\alpha$ is a primitive element of $\mathrm{GF}(q^m)$, and encode $D_{\mathrm{priv}}$ to obtain

   $$C^{(0)}_{\mathrm{priv}} = (c_1, \ldots, c_n)$$

### 3.2 Cryptographic Scrambling

1. **Key expansion:** Derive $K' = f(K)$ via a key derivation function $f$, yielding sufficient key material.

2. **Permutation and transformation:** Define a permutation $\pi_K: \{1, \ldots, n\} \to \{1, \ldots, n\}$ from $K'$, and compute

   $$c'_i = c_{\pi_K(i)}$$
   
   Then apply an additional transformation:
   
   $$c'_i \leftarrow c'_i \oplus h(K', i) \bmod q$$

   where $h$ is a keyed hash function. The resulting scrambled codeword is $C_{\mathrm{priv}} = (c'_1, \ldots, c'_n)$.

## 4. Integration Layer

### 4.1 Module Replacement Strategy

1. **Selection of replaceable modules:** Let $\mathcal{B}' \subseteq \mathcal{B}$ be the set of replaceable black modules, excluding modules in finder patterns, alignment patterns, and timing patterns. Define a deterministic ordering function

   $$\sigma: \mathcal{B}' \to \{1, \ldots, |\mathcal{B}'|\}$$

2. **Pattern mapping:** For each $i \in \{1, 2, \ldots, \min(n, |\mathcal{B}'|)\}$, find the module position $(a, b) \in \mathcal{B}'$ such that $\sigma((a, b)) = i$, and replace the black module at position $(a, b)$ with pattern $P_{c'_i+1}$.

3. **Overflow handling:** If $|\mathcal{B}'| < n$, use only the first $|\mathcal{B}'|$ symbols of $C_{\mathrm{priv}}$, ensuring that critical QR code structures remain intact.

## 5. Pattern Selection Criteria

1. **Information-theoretic capacity:** Each pattern $P_i$ encodes $\log_2 q = 3$ bits of information; the total private channel capacity is $n \cdot \log_2 q$ bits.

2. **Visual distinctiveness metric:** Define a distance function $d(P_i, P_j)$ that quantifies the visual difference between patterns and ensure

   $$\min_{i \neq j} d(P_i, P_j) \geq \delta$$

   for some threshold $\delta$.

3. **Pattern set optimization:** Choose the set $P$ to maximize $\min_{i \neq j} d(P_i, P_j)$ while preserving QR code readability.

## 6. Security Analysis

1. **Brute-force resistance:** Without knowledge of key $K$, an attacker faces a search space of size $q^n \approx 2^{n \cdot \log_2 q} \approx 2^{300}$ for typical values ($n \approx 100$, $q = 8$).

2. **Pattern indistinguishability:** The scrambling operation ensures that even if an attacker can distinguish patterns, the mapping to original message symbols remains secure, equivalent to symmetric encryption with key length $n \cdot \log_2 q$ bits.

## 7. Mathematical Constraints

1. **Error correction capacity:** The private channel can correct up to $t = \lfloor(n-k)/2\rfloor$ symbol errors; the pattern detection error rate must be below $t/n$ for reliable decoding.

2. **Public-private channel interference:** Define the replacement ratio as

   $$\rho = \frac{|\mathcal{B}'|}{|\mathcal{B}|}$$

   The public channel remains readable if $\rho \leq \rho_{\max}(E)$, where $\rho_{\max}(E)$ depends on the error correction level $E$.

3. **Private message length constraint:** The maximum private message length in bits satisfies

   $$|M_{\mathrm{priv}}| \leq \frac{k \cdot \log_2 q}{b}$$

   where $b$ is the bits per character in the chosen encoding.

## 8. Pattern Implementation Requirements

### 8.1 Visual Pattern Specifications

For the set of $q = 8$ patterns, the following specific designs provide optimal distinguishability:

1. **Square Center Pattern ($P_1$):** Black module with a white square occupying 40-50% of the area, centered.

2. **Circle Center Pattern ($P_2$):** Black module with a white circle of diameter 40-50% of module width, centered.

3. **Diagonal Cross Pattern ($P_3$):** Black module with a white "X" crossing from corner to corner, line width 15-20% of module width.

4. **Horizontal Bar Pattern ($P_4$):** Black module with a white horizontal bar through center, height 30-40% of module height.

5. **Vertical Bar Pattern ($P_5$):** Black module with a white vertical bar through center, width 30-40% of module width.

6. **Corner Dots Pattern ($P_6$):** Black module with white dots in each corner, each dot occupying 15-20% of module area.

7. **Checkered Pattern ($P_7$):** Black module with white in opposite corners (diagonal arrangement), covering 50% of module area.

8. **Border Frame Pattern ($P_8$):** Black module with white inner frame, frame thickness 15-20% of module width.

### 8.2 Detection Requirements

1. Each pattern must be correctly identified with at least 98% accuracy under normal scanning conditions.

2. Patterns must maintain distinguishability under rotation, scaling, and perspective transformations.

3. The distance function $d(P_i, P_j)$ should be based on structural features that persist under typical distortions encountered during scanning.

<!-- PATTERN LIBRARY --->

# Requirements for 8 Textured Patterns in a 2LQR Code System

## Pattern Design Requirements

1. **Visual Distinctiveness**: Each pattern must be uniquely identifiable from the other 7 patterns by machine vision algorithms, even under non-ideal scanning conditions.

2. **Contrast Preservation**: All patterns must maintain sufficient contrast against white space to ensure the public QR code remains readable by standard scanners.

3. **Scale Invariance**: Patterns must be recognizable at various scanning distances and resolutions.

4. **Rotation Resistance**: Patterns should be identifiable regardless of the scanning angle (0°, 90°, 180°, 270°).

5. **Error Tolerance**: Patterns should be distinct enough that partial damage or distortion doesn't cause misidentification.

6. **Aesthetic Consistency**: All patterns should share a common visual language while remaining distinct.

## Technical Pattern Specifications

### Pattern 1: Square Center
- Black module with a white square in the center
- White square should be 40-50% of the module area
- Centered precisely within the module

### Pattern 2: Circle Center
- Black module with a white circle in the center
- Circle diameter should be 40-50% of the module width
- Centered precisely within the module

### Pattern 3: Diagonal Cross
- Black module with a white "X" crossing from corner to corner
- Line width should be 15-20% of the module width
- Lines must extend fully from corner to corner

### Pattern 4: Horizontal Bar
- Black module with a white horizontal bar through the center
- Bar height should be 30-40% of the module height
- Bar should extend fully from left to right

### Pattern 5: Vertical Bar
- Black module with a white vertical bar through the center
- Bar width should be 30-40% of the module width
- Bar should extend fully from top to bottom

### Pattern 6: Corner Dots
- Black module with white dots in each corner
- Dots should be 15-20% of the module area each
- Dots should be equidistant from adjacent edges

### Pattern 7: Checkered
- Black module with opposite corners filled with white
- White areas should occupy 2 of the 4 quadrants (diagonal arrangement)
- Clean lines separating the black and white regions

### Pattern 8: Border Frame
- Black module with white inner frame
- Frame thickness should be 15-20% of the module width
- Frame should be equidistant from all edges

## Implementation Requirements

1. **Bit Representation**: Each pattern represents a 3-bit value (000 through 111), enabling encoding of the scrambled codeword.

2. **Pattern Selection Algorithm**: Define a deterministic mapping between 3-bit sequences and specific patterns.

3. **Detection Accuracy**: The system must correctly identify patterns with at least 98% accuracy under normal scanning conditions.

4. **Error Correction**: Include rules for handling ambiguous pattern detection through contextual analysis.

5. **Density Limitations**: Define maximum pattern density to prevent scanning errors (e.g., no more than 70% of black modules should be replaced with textured patterns).

6. **Testing Requirements**: Each pattern must be validated across multiple devices, lighting conditions, and printing materials.

The pattern library should be implemented as a reusable component that can be integrated into both encoding and decoding software, with provisions for future expansion to additional patterns if needed.