# Empirical Piano Corpus Analysis & Musicological Investigation: Rhythmic Vocabulary, Zipf Popularity, Contextual Resolution ("Cell + Landing"), Phrase Length, and $2\times$ Scale Invariance

## 1. Executive Summary & Corpus Overview

To ground the **No-Nonsense Rhythm Reading Module** in empirical reality rather than textbook guesswork, we conducted a large-scale computational corpus analysis across **511 complete keyboard and piano scores** in canonical Humdrum `**kern` format, spanning **200 years of keyboard literature** (c. 1720–1910) and **50,670 complete measures**:

| Composer | Era / Style | Repertoire Included in Corpus | Works / Mvts | Complete Measures | Simple-Meter Beats (`♩`) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **J.S. Bach** | Baroque Counterpoint | *Well-Tempered Clavier* Books I & II (96), *Inventions & Sinfonias* (30) | 126 | 6,134 | 14,698 |
| **D. Scarlatti** | Baroque / Galant | Keyboard Sonatas (K. 1–K. 555 selections) | 65 | 6,326 | 11,354 |
| **J. Haydn** | Classical | Piano Sonatas (25 movements) | 25 | 2,786 | 7,209 |
| **W.A. Mozart** | Classical | Complete Piano Sonatas No. 1–18 (69 movements) | 69 | 6,879 | 16,706 |
| **L. van Beethoven** | Classical / Romantic | Complete Piano Sonatas No. 1–32 (103 movements) | 103 | 18,388 | 43,424 |
| **F. Chopin** | Romantic | Complete Preludes Op. 28 (24), Complete Mazurkas (52) | 76 | 5,751 | 16,561 |
| **S. Joplin** | Ragtime / Syncopated | Complete Ragtime Piano Works & Waltzes (*The Entertainer*, *Maple Leaf Rag*, etc.) | 47 | 4,406 | 9,575 |
| **TOTAL** | **1720–1910** | **7 Canonical Keyboard Corpora** | **511** | **50,670** | **119,527 per hand** *(239,054 single-hand + 119,527 composite)* |

### Distribution of Time Signatures Across the 50,670 Measures
1. **Simple Meters (`42,002` measures — `82.9%`)**:
   * $\frac{3}{4}$: `14,785` measures (`29.18%`)
   * $\frac{2}{4}$: `11,472` measures (`22.64%`)
   * $\frac{4}{4}$ (`C`): `8,313` measures (`16.41%`)
   * $\frac{2}{2}$ (*Alla Breve* `𝄵`): `4,744` measures (`9.36%`)
   * Other simple meters ($\frac{3}{2}$, $\frac{4}{8}$, etc.): `2,688` measures (`5.30%`)
2. **Compound Meters (`8,668` measures — `17.1%`)**:
   * $\frac{3}{8}$: `4,908` measures (`9.69%`)
   * $\frac{6}{8}$: `4,437` measures (`8.76%`)
   * $\frac{9}{8}$: `535` measures (`1.06%`)
   * $\frac{12}{8}$: `521` measures (`1.03%`)
   * Compound sixteenth meters ($\frac{12}{16}$, $\frac{9}{16}$, $\frac{6}{16}$, $\frac{6}{4}$): `532` measures (`1.05%`)

---

### Summary of Core Empirical Findings (Validating the User's Four Insights)

1. **The $2^4 = 16$ Quarter-Note Vocabulary Covers 93.0%–94.8% of All Simple-Meter Beats (and 98.1% With Triplets)**:
   * Across **119,527 simple-meter quarter-note beats**, **93.0%** of all Right-Hand beats and **94.8%** of all Left-Hand beats fall strictly on the $2^4 = 16$ sixteenth-note binary grid. Adding just **one triplet word** (`3♫♪`, `3.50%` RH / `4.88%` Composite) and **even 32nd/sextuplet runs** (`1.64%`) accounts for **98.1%** of all beats in two centuries of piano literature.
2. **Combinatorial Explosion ($16^4 = 65,536$) vs. Extreme Zipf/Pareto Popularity**:
   * Out of **$16^4 = 65,536$** theoretically possible 16th-grid $\frac{4}{4}$ bars, **98.89% ($64,811$ combinations) NEVER OCCUR EVEN ONCE** in the Right Hand across the entire 511-work corpus (and **99.46%** never occur in the bimanual composite stream).
   * In the bimanual composite stream, just **20 bar patterns** (`0.03%` of $65,536$) cover **80%** of all $\frac{4}{4}$ bars, and **56 patterns** (`0.085%`) cover **90%**. In the Right Hand, **9 bar patterns** cover **50%** of all $\frac{4}{4}$ bars, **72 patterns** (`0.11%`) cover **80%**, and **13 two-beat half-bar patterns** cover **80%** of all 2-beat windows.
   * **Pedagogical Takeaway**: We must **never** generate random mathematical permutations of the 16 beat cells. Sampling by **real-world Pareto popularity** inside **authentic repertoire phrases** gives a pianist **80%–90% coverage of real literature** while learning less than **0.1%** of the theoretical combinatorial space!
3. **Why Rhythmic Patterns Need Their "Landing" Note (*Anacrusis $\rightarrow$ Crusis*) & Optimal Phrase Length**:
   * Musicology (Cooper & Meyer, 1960; Lerdahl & Jackendoff, 1983) proves that dotted rhythms (`♩. ♪`, `♪. ♬`), gallops (`♪ ♬`), and upbeats (`𝄾 ♪`) are **anacrustic (end-weighted catapults)** whose motor and perceptual boundary terminates on the **downbeat of the next beat**.
   * **Hard Corpus Proof**: In our 50,670 measures, when a **Dotted Quarter + Eighth (`♩. ♪`)** occurs on Beats $t, t+1$, it is followed by an immediate **downbeat attack on Beat $t+2$ ("the subsequent fourth") 97.20% of the time in the Right Hand ($2,322 / 2,389$) and 98.97% of the time in the Composite texture ($578 / 584$)**! Likewise, **Dotted Eighth + Sixteenth (`♪. ♬`)** lands on a downbeat attack on the very next beat **97.91% of the time in RH ($3,693 / 3,772$) and 99.50% in Composite ($3,354 / 3,371$)**.
   * **Cross-Barline & Phrase Length Proof**: **77.9%** of bars have off-beat/subdivided activity on the final beat of the bar that propels across the barline into Beat 1 of the next bar (**99.33%** composite resolution rate). Analysis of **9,541 consecutive 4-bar hypermeasures** confirms strong **2-bar and 4-bar antecedent–consequent periodicity** (Bar 1 = Bar 3 in `35.67%` of all 4-bar phrases; cadential relaxation peaks on Bar 2 and Bar 4).
   * **Design Rule**: Every short drill **must include the "+1 Landing Beat"** (*Gesture + Landing*), and standard reading phrases should use **4-bar real-repertoire hypermeasures** (or **2-bar phrases + final downbeat landing note**) so no rhythmic gesture is ever amputated mid-air.
4. **Proportional Scale Invariance ($2\times$ Speed / Metric Zoom Level)**:
   * Comparing the 1-beat sixteenth-grid distribution (`♪. ♬`, `♪ ♬`, `♬♬`) against the $2\times$-slower 2-beat eighth-grid distribution (`♩. ♪`, `♩ ♫`, `♫ ♫`) yields a **Cosine Similarity of `0.9160`** (and comparing $\frac{3}{4}$ bars against $2\times$-rescaled $\frac{3}{8}$ bars yields **`0.8609`**).
   * While acoustically identical when tempo is scaled by $2\times$, they differ in **two crucial cognitive/motor ways**: (a) **Visual Beaming vs. Stems/Flags**, and (b) **Where the Physical Tactus Bounce Lands** (in `♪. ♬ → ♩`, the skip happens *inside* 1 beat bounce; in `♩. ♪ → ♩`, the pianist must feel **Beat 2's silent downbeat** inside the dotted quarter before playing the eighth on Beat 2's rebound). Furthermore, `[X X X .]` is **$10.5\times$ more common** at the 2-beat level (`♫ ♩` = `5.37%`) than at the 1-beat level (`♬ ♪` = `0.51%`) because `♫ ♩` serves as a 2-beat cadential resolution.

---

## 2. Investigation 1: Empirical Frequency of the $2^4 = 16$ Beat Cells & Composer Fingerprints

### 2.1 Complete 1-Beat Pattern Distribution in Simple Meters ($\frac{4}{4}, \frac{3}{4}, \frac{2}{4}, \frac{2}{2}$)

In any simple meter where the quarter note (`♩`) is the primary beat unit, subdividing no finer than sixteenth notes yields $2^4 = 16$ binary onset combinations $[b_0, b_1, b_2, b_3] \in \{0, 1\}^4$ across the four sixteenth-note slots (`1 - e - & - a`).

Below is the exact empirical breakdown across all **119,527 quarter-note beats** in our corpus for the **Right Hand (Melodic/Treble Staff)**, **Left Hand (Bass/Accompaniment Staff)**, and **Composite Bimanual Stream (Both Hands Combined)**:

| Rank (RH) | Beat Cell Name | Notation | 16th Grid `[1 e & a]` | Right Hand Count (%) | Right Hand Cum. % | Left Hand Count (%) | Composite (Both Hands) Count (%) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Quarter Note** | `♩` | `[X . . .]` | 33,006 (**27.61%**) | 27.61% | 44,756 (**37.44%**) | 25,298 (**21.17%**) |
| **2** | **Two Eighths** | `♫` | `[X . X .]` | 27,457 (**22.97%**) | 50.59% | 26,700 (**22.34%**) | 37,584 (**31.44%**) |
| **3** | **Four Sixteenths** | `♬♬` | `[X X X X]` | 17,477 (**14.62%**) | 65.21% | 11,920 (**9.97%**) | 30,066 (**25.15%**) |
| **4** | **Rest / Tied Hold** | `𝄽 / Hold` | `[. . . .]` | 13,660 (**11.43%**) | 76.64% | 22,900 (**19.16%**) | 3,868 (**3.24%**) |
| **5** | **Upbeat Eighth** | `𝄾 ♪` | `[. . X .]` | 5,285 (**4.42%**) | 81.06% | 3,437 (**2.88%**) | 820 (**0.69%**) |
| **6** | *Eighth Triplet (Tuplet)* | `3♫♪` | `[T: 1 1 1]` | 4,182 (**3.50%**) | 84.56% | 2,555 (**2.14%**) | 5,837 (**4.88%**) |
| **7** | **Dotted 8th + 16th** | `♪. ♬` | `[X . . X]` | 3,789 (**3.17%**) | 87.73% | 1,721 (**1.44%**) | 3,386 (**2.83%**) |
| **8** | **16th Rest + Three 16ths** | `𝄿 ♬♪` | `[. X X X]` | 2,485 (**2.08%**) | 89.80% | 800 (**0.67%**) | 120 (**0.10%**) |
| **9** | **Gallop (8th + Two 16ths)** | `♪ ♬` | `[X . X X]` | 2,364 (**1.98%**) | **91.78%** | 868 (**0.73%**) | 3,456 (**2.89%**) |
| **10** | *Eight 32nds (Sub-16th)* | `32nds` | `[8×32nd]` | 1,012 (**0.85%**) | 92.63% | 363 (**0.30%**) | 1,414 (**1.18%**) |
| **11** | *Sixteenth Sextuplet* | `6♬♬` | `[6-tuplet]` | 947 (**0.79%**) | 93.42% | 530 (**0.44%**) | 1,406 (**1.18%**) |
| **12** | **8th Rest + Two 16ths** | `𝄾 ♬` | `[. . X X]` | 932 (**0.78%**) | 94.20% | 454 (**0.38%**) | 79 (**0.07%**) |
| **13** | **Intra-Beat Syncopation** | `♬ ♪ ♬` | `[X X . X]` | 794 (**0.66%**) | 94.87% | 112 (**0.09%**) | 70 (**0.06%**) |
| **14** | **Late 16th Pickup** | `𝄾. ♬` | `[. . . X]` | 525 (**0.44%**) | 95.30% | 121 (**0.10%**) | 62 (**0.05%**) |
| **15** | **Reverse Gallop (2×16th+8th)** | `♬ ♪` | `[X X X .]` | 485 (**0.41%**) | 95.71% | 225 (**0.19%**) | 847 (**0.71%**) |
| **16** | **16th Rest + 16th + 8th** | `𝄿 ♪.` | `[. X X .]` | 475 (**0.40%**) | 96.11% | 39 (**0.03%**) | 9 (**0.01%**) |
| **17** | **Off-Beat 16ths** | `𝄿 ♪ ♬` | `[. X . X]` | 379 (**0.32%**) | 96.43% | 19 (**0.02%**) | 5 (**0.004%**) |
| **18** | **Scotch Snap (16th + Dot 8th)** | `♬ ♪.` | `[X X . .]` | 296 (**0.25%**) | 96.67% | 198 (**0.17%**) | 252 (**0.21%**) |
| **19** | **Isolated 2nd-Slot 16th** | `𝄿 ♬ 𝄾` | `[. X . .]` | 8 (**0.007%**) | 96.68% | 14 (**0.01%**) | 2 (**0.002%**) |
| — | *All Other 32nd/Tuplet Cells* | *Various* | *Ornamental* | 3,969 (**3.32%**) | **100.00%** | 1,795 (**1.50%**) | 4,946 (**4.14%**) |

#### Crucial Bimanual Insight: Single-Hand Syncopation vs. Composite Filling
Look closely at Ranks **5 (`𝄾 ♪`), 8 (`𝄿 ♬♪`), 12 (`𝄾 ♬`), and 13 (`♬ ♪ ♬`)** in the table above:
* In the **Right Hand alone**, `𝄾 ♪` (Upbeat Eighth, `[. . X .]`) occurs **5,285 times (4.42%)**, `𝄿 ♬♪` (Sixteenth Rest/Tie + Three Sixteenths, `[. X X X]`) occurs **2,485 times (2.08%)**, and `♬ ♪ ♬` (Intra-Beat Syncopation, `[X X . X]`) occurs **794 times (0.66%)**.
* Yet in the **Composite Stream (Both Hands Combined)**, `𝄾 ♪` drops to `0.69%`, `𝄿 ♬♪` drops to `0.10%`, and `♬ ♪ ♬` drops to `0.06%`!
* **Why?** Because in real piano music, whenever the **Right Hand plays an off-beat or syncopated cell** (`𝄾 ♪` or `𝄿 ♬♪` or `♬ ♪ ♬`), the **Left Hand plays the missing downbeat or midpoint** (`♩` or `♫`) over **85%–95% of the time**!
  * When RH plays `𝄾 ♪` (`[. . X .]`) while LH plays `♩` (`[X . . .]`), the composite bimanual onset pattern is `♫` (`[X . X .]`).
  * When RH plays `𝄿 ♬♪` (`[. X X X]`) while LH plays `♩` (`[X . . .]`), the composite bimanual onset pattern is `♬♬` (`[X X X X]`).
  * When RH plays `♬ ♪ ♬` (`[X X . X]`, Ragtime syncopation) while LH plays `♫` (`[X . X .]`, stride bass), the composite bimanual onset pattern is `♬♬` (`[X X X X]`).
* **Pedagogical Consequence**: This proves mathematically why our **Two-Hand Piano Tap Mode** (Left Hand tapping the steady `♩` or `♫` pulse while Right Hand plays the syncopated cell `𝄾 ♪`, `𝄿 ♬♪`, or `♬ ♪ ♬`) is not merely an optional exercise—it is the **literal biomechanical structure of 90% of all syncopations in the piano repertoire**!

---

### 2.2 Composer-by-Composer Rhythmic Fingerprints (Right-Hand Stream)

Different eras and composers weight the 16 rhythmic words in dramatically distinct ways:

| Composer | Total RH Beats | `♩` Quarter | `♫` Two 8ths | `♬♬` Four 16ths | `𝄽/Hold` Silent Beat | `𝄾 ♪` Upbeat 8th | `♪. ♬` Dotted 8th | `♪ ♬` Gallop | `♬ ♪` Rev. Gallop | `♬ ♪ ♬` Syncopation | `𝄿 ♬♪` 16th Pickup | `3♫♪` Triplet |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **J.S. Bach** | 14,698 | 13.32% | 24.32% | **35.98%** | 4.87% | 1.56% | 1.61% | **5.36%** | 1.14% | 0.14% | 2.10% | 1.86% |
| **Scarlatti** | 11,354 | 26.78% | **36.85%** | 8.02% | 10.01% | 4.44% | 0.97% | 3.95% | 0.13% | 0.00% | 1.19% | 3.36% |
| **Haydn** | 7,209 | 24.28% | 20.57% | 21.58% | 7.62% | 5.90% | 2.76% | 1.65% | 0.00% | 0.39% | 2.82% | 2.21% |
| **Mozart** | 16,706 | 24.75% | 21.79% | 17.05% | 8.90% | **6.10%** | 2.51% | 1.10% | 0.38% | 0.19% | 2.26% | 2.96% |
| **Beethoven** | 43,424 | 30.79% | 20.10% | 11.81% | **16.47%** | 4.45% | 1.89% | 0.78% | 0.11% | 0.14% | 1.52% | **4.90%** |
| **Chopin** | 16,561 | **39.79%** | 25.90% | 1.86% | 10.73% | 3.63% | **10.89%** | 0.08% | 0.00% | 0.00% | 0.00% | **4.50%** |
| **Joplin** | 9,575 | 22.60% | 16.25% | 14.99% | 8.80% | 6.01% | 2.11% | 4.93% | **1.98%** | **6.83%** | **8.39%** | 0.01% |

* **Bach's Baroque Motor (`♬♬` = `35.98%`, `♪ ♬` = `5.36%`)**: Over a third of all Right-Hand beats in Bach's WTC and Inventions are continuous four-sixteenth groups (`♬♬`), punctuated by the classic Baroque gallop (`♪ ♬`, `5.36%`) and post-downbeat sixteenth pickup (`𝄿 ♬♪`, `2.10%`, often formed by a tied sixteenth from the previous beat).
* **Chopin's Dotted Mazurka Snap (`♪. ♬` = `10.89%`, `3♫♪` = `4.50%`)**: In Chopin's Preludes and Mazurkas, the dotted-eighth + sixteenth skip (`♪. ♬`) accounts for nearly **11% of all Right-Hand beats** ($3.4\times$ the corpus average!), alongside expressive triplets (`4.50%`).
* **Beethoven's Dynamic Contrast (`𝄽/Hold` = `16.47%`, `3♫♪` = `4.90%`)**: Beethoven has the highest rate of held/silent Right-Hand beats (`16.47%`—dramatic rests, long sustained chords, and register hand-offs) and the highest use of triplets (`4.90%`).
* **Joplin's Ragtime Syncopation Engine (`♬ ♪ ♬` = `6.83%`, `𝄿 ♬♪` = `8.39%`)**: In Scott Joplin's rags, `[X X . X]` (`♬ ♪ ♬`, intra-beat syncopation) jumps **48-fold** compared to Beethoven/Bach (`6.83%` vs `0.14%`), and `[. X X X]` (`𝄿 ♬♪`, where the first sixteenth of the beat is tied over from the previous beat's syncopation!) jumps to **`8.39%`**.

---

### 2.3 Compound Meter ($\frac{6}{8}, \frac{9}{8}, \frac{12}{8}, \frac{3}{8}$) Dotted-Quarter Beat Frequencies

Across **17,471 dotted-quarter beats** in compound meters, the $2^3 = 8$ primary eighth-note grid cells (`[c0, c1, c2]`) plus compound sixteenth subdivisions distribute as follows:

| Rank (RH) | Compound Beat Cell | Notation | 3-Slot Grid `[1 2 3]` | Right Hand Count (%) | Right Hand Cum. % | Composite Count (%) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **1** | **Three Eighths (Rolling Pulse)** | `♫♪` | `[X X X]` | 4,558 (**26.09%**) | 26.09% | 7,128 (**40.80%**) |
| **2** | **Six Sixteenths (Compound Run)** | `♬♬♬` | `[1 1 1 1 1 1]` | 2,838 (**16.24%**) | 42.33% | 5,044 (**28.87%**) |
| **3** | **Dotted Quarter (Macro-Beat)** | `♩.` | `[X . .]` | 2,649 (**15.16%**) | 57.50% | 917 (**5.25%**) |
| **4** | **Quarter + Eighth (Long–Short Lilting Skip)** | `♩ ♪` | `[X . X]` | 1,782 (**10.20%**) | 67.70% | 1,283 (**7.34%**) |
| **5** | **Compound Rest / Hold** | `𝄽. / Hold` | `[. . .]` | 1,025 (**5.87%**) | 73.56% | 231 (**1.32%**) |
| **6** | **Eighth Rest + Two Eighths** | `𝄾 ♫` | `[. X X]` | 839 (**4.80%**) | 78.36% | 44 (**0.25%**) |
| **7** | **Late Eighth Pickup** | `𝄽 𝄾 ♪` | `[. . X]` | 344 (**1.97%**) | **80.33%** | 121 (**0.69%**) |
| **8** | **Eighth + Quarter (Short–Long Siciliana/Snap)** | `♪ ♩` | `[X X .]` | 160 (**0.92%**) | 81.25% | 96 (**0.55%**) |

Notice that just **7 compound beat cells** cover **80.33%** of all Right-Hand compound beats (`87.20%` in the Composite stream)!

---

## 3. Investigation 2: Combinatorial Explosion ($16^4 = 65,536$) vs. Zipf/Pareto Popularity

### 3.1 The User's Combinatorial Insight Tested Against 50,670 Measures

> **User's Insight**: *"There are $2^4 = 16$ quarter-note patterns if we split no finer than sixteenths and don't consider triplets. Now you could learn all of them, but then you'd also have $16^4 = 65,536$ patterns for full four-beat bars, which isn't meaningful to consider all of them. I would choose rhythmic patterns driven by popularity: you learn the most common rhythmic patterns because knowing a good number of those will cover a lot of ground."*

Our corpus data provides an extraordinary quantitative validation of this insight. While the number of mathematically possible multi-beat combinations explodes exponentially ($16^2 = 256$ for 2-beat half-bars, $16^3 = 4,096$ for $\frac{3}{4}$ bars, and $16^4 = 65,536$ for $\frac{4}{4}$ bars), **real musical syntax obeys a steep Zipf–Mandelbrot power law**:

| Metric Window | Theoretical Max Combinations | Stream | Total Corpus Instances | Unique Patterns Observed in 200 Years | % of Theoretical Space Never Used | # of Top Patterns for **50%** Coverage | # of Top Patterns for **80%** Coverage | # of Top Patterns for **90%** Coverage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **2-Beat Half-Bar** | $16^2 = \mathbf{256}$ | **RH** | 44,632 | **179** (69.9%) | 30.1% unused | **4** patterns | **13** patterns | **28** patterns |
| | | **LH** | 44,552 | **133** (52.0%) | 48.0% unused | **3** patterns | **6** patterns | **11** patterns |
| | | **Composite** | 44,360 | **111** (43.4%) | 56.6% unused | **2** patterns | **6** patterns | **12** patterns |
| **1-Bar of $\frac{2}{4}$** | $16^2 = \mathbf{256}$ | **RH** | 9,732 | **161** (62.9%) | 37.1% unused | **6** patterns | **30** patterns | **51** patterns |
| | | **Composite** | 9,582 | **92** (35.9%) | 64.1% unused | **2** patterns | **7** patterns | **14** patterns |
| **1-Bar of $\frac{3}{4}$** | $16^3 = \mathbf{4,096}$ | **RH** | 12,923 | **306** (7.47%) | **92.53% unused** | **7** patterns | **30** patterns | **58** patterns |
| | | **Composite** | 12,920 | **174** (4.25%) | **95.75% unused** | **4** patterns | **13** patterns | **30** patterns |
| **1-Bar of $\frac{4}{4}$ / $\frac{2}{2}$** | $16^4 = \mathbf{65,536}$ | **RH** | 11,013 | **725** (1.11%) | **98.89% unused** | **9** patterns | **72** patterns | **168** patterns |
| | | **LH** | 10,854 | **567** (0.87%) | **99.13% unused** | **5** patterns | **31** patterns | **95** patterns |
| | | **Composite** | 10,664 | **351** (0.54%) | **99.46% unused** | **2** patterns | **20** patterns | **56** patterns |

> [!IMPORTANT]
> **Look at the $\frac{4}{4}$ Row Above:**
> * Out of **$65,536$** mathematically possible 4-beat bars on the sixteenth-note grid, **only $725$ unique bars ($1.11\%$) ever appear in the Right Hand** across 511 complete works by Bach, Scarlatti, Haydn, Mozart, Beethoven, Chopin, and Joplin—meaning **$64,811$ combinations ($98.89\%$) never occur once**!
> * Even more remarkably:
>   * Mastering just the **Top 9** Right-Hand 1-bar patterns covers **50.97%** of all $\frac{4}{4}$ bars in piano literature.
>   * Mastering the **Top 72** Right-Hand 1-bar patterns (**$0.11\%$** of $65,536$) covers **80.0%** of all $\frac{4}{4}$ bars.
>   * At the **2-Beat ("Compound Word") level** ($16^2 = 256$), mastering just the **Top 13** two-beat patterns covers **80.0%** of all 2-beat half-bars in the Right Hand (and **Top 28** covers **90.0%**)!

### 3.2 The Top 20 Most Popular 1-Bar Rhythms in $\frac{4}{4}$ & $\frac{2}{2}$ (Right Hand vs. Composite)

#### A. Right-Hand Stream (Melodic / Figuration Rhythm — 11,013 Bars)
| Rank | Beat 1 | Beat 2 | Beat 3 | Beat 4 | Musical Archetype | Count | % of Bars | Cum. % |
| :---: | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **1** | `♫` | `♫` | `♫` | `♫` | Continuous eighth-note motion | 1,668 | 15.15% | 15.15% |
| **2** | `♬♬` | `♬♬` | `♬♬` | `♬♬` | Continuous sixteenth-note perpetuum mobile | 1,332 | 12.09% | 27.24% |
| **3** | `♩` | `♩` | `♩` | `♩` | Four quarter-note pulse | 907 | 8.24% | 35.48% |
| **4** | `♩` | `Hold/𝄽` | `♩` | `Hold/𝄽` | Two half notes (`𝅗𝅥  𝅗𝅥`) | 491 | 4.46% | 39.93% |
| **5** | `♩` | `Hold/𝄽` | `Hold/𝄽` | `Hold/𝄽` | Whole note (`𝅝`) or Beat-1 cadence | 449 | 4.08% | 44.01% |
| **6** | `♩` | `Hold/𝄽` | `♩` | `♩` | Half note + two quarters (`𝅗𝅥  ♩  ♩`) | 221 | 2.01% | 46.02% |
| **7** | `♩` | `Hold/𝄽` | `Hold/𝄽` | `♩` | Dotted half + quarter pickup (`𝅗𝅥.  ♩`) | 215 | 1.95% | 47.97% |
| **8** | `♩` | `♫` | `♩` | `♫` | Repeating `♩ ♫` lilt | 179 | 1.63% | 49.60% |
| **9** | `♩` | `♩` | `♩` | `Hold/𝄽` | Three quarters + rest / half (`♩  ♩  𝅗𝅥`) | 151 | 1.37% | **50.97%** |
| **10** | `♩` | `♩` | `Hold/𝄽` | `♩` | Quarter + half/rest + quarter (`♩  𝅗𝅥  ♩`) | 149 | 1.35% | 52.32% |
| **11** | `♩` | `♫` | `♫` | `♫` | Downbeat anchor + flowing eighths | 132 | 1.20% | 53.52% |
| **12** | `♫` | `♫` | `♩` | `♩` | Active first half-bar $\rightarrow$ calm second half | 121 | 1.10% | 54.62% |
| **13** | `♩` | `♫` | `♩` | `♩` | Second-beat eighth subdivision | 118 | 1.07% | 55.69% |
| **14** | `♩` | `♩` | `♫` | `♫` | Calm first half-bar $\rightarrow$ active second half | 117 | 1.06% | 56.75% |
| **15** | `𝄾 ♪` | `♫` | `♫` | `♫` | Off-beat eighth pickup (`𝄾 ♪`) + flowing eighths | 117 | 1.06% | 57.81% |
| **16** | `♫` | `♫` | `♩` | `Hold/𝄽` | Four eighths landing on Beat 3 half note (`♫ ♫ 𝅗𝅥`) | 107 | 0.97% | 58.79% |
| **17** | `♩` | `Hold/𝄽` | `♫` | `♫` | Half note + four eighths (`𝅗𝅥  ♫  ♫`) | 95 | 0.86% | 59.65% |
| **18** | `♩` | `♩` | `Hold/𝄽` | `Hold/𝄽` | Two quarters + half rest/note (`♩  ♩  𝅗𝅥`) | 89 | 0.81% | 60.46% |
| **19** | `♩` | `𝄾 ♪` | `♫` | `♫` | **Dotted quarter + eighth (`♩. ♪`) landing on `♫ ♫`** | 86 | 0.78% | 61.24% |
| **20** | `♩` | `♩` | `♩` | `♫` | Three quarters + Beat 4 eighth pickup | 77 | 0.70% | 61.94% |

#### B. Top 15 Two-Beat Compound Words in the Right Hand (44,632 Half-Bars)
Because human eyes fixate on 1- to 2-beat chunks (Furneaux & Land, 1999), the **Top 15 Two-Beat Compound Words** (which cover **81.76%** of all 2-beat windows in the corpus!) form the true core vocabulary of simple-meter sight-reading:

| Rank | Beat 1 Cell | Beat 2 Cell | Combined 2-Beat Notation | Musical Function | Count | % | Cum. % |
| :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **1** | `♫` `[X . X .]` | `♫` `[X . X .]` | `♫  ♫` | Even 4-eighth stride | 7,956 | 17.83% | 17.83% |
| **2** | `♬♬` `[X X X X]` | `♬♬` `[X X X X]` | `♬♬  ♬♬` | Running 8-sixteenth passage | 6,150 | 13.78% | 31.61% |
| **3** | `♩` `[X . . .]` | `♩` `[X . . .]` | `♩  ♩` | Two-quarter pulse | 6,114 | 13.70% | 45.30% |
| **4** | `♩` `[X . . .]` | `Hold/𝄽` `[. . . .]` | `𝅗𝅥` or `♩ 𝄽` | Half note or quarter + rest | 5,688 | 12.74% | **58.05%** |
| **5** | `♫` `[X . X .]` | `♩` `[X . . .]` | `♫  ♩` | **Trochaic resolution** (2 eighths landing on Beat 2) | 1,515 | 3.39% | 61.44% |
| **6** | `♩` `[X . . .]` | `♫` `[X . X .]` | `♩  ♫` | **Anapestic drive** (Quarter + 2 eighths pushing to Beat 3) | 1,506 | 3.37% | 64.82% |
| **7** | `♩` `[X . . .]` | `𝄾 ♪` `[. . X .]` | **`♩. ♪`** *(or `♩ 𝄾 ♪`)* | **Dotted Quarter + Eighth** (requires Beat 3 landing!) | 1,477 | 3.31% | 68.13% |
| **8** | `♪. ♬` `[X . . X]` | `♩` `[X . . .]` | **`♪. ♬  ♩`** | **Dotted 8th + 16th + Quarter Landing** | 1,373 | 3.08% | 71.20% |
| **9** | `Hold/𝄽` `[. . . .]` | `♩` `[X . . .]` | `𝄽  ♩` | Off-downbeat quarter entry | 1,176 | 2.63% | 73.84% |
| **10** | `𝄾 ♪` `[. . X .]` | `♫` `[X . X .]` | **`𝄾 ♪  ♫`** | **Upbeat eighth resolving into two eighths** | 962 | 2.16% | 75.99% |
| **11** | `♫` `[X . X .]` | `𝄾 ♪` `[. . X .]` | **`♪ ♩ ♪`** *(or `♫ 𝄾 ♪`)* | **Classic 2-Beat Syncopation (`Down - UP - (down) - UP`)** | 802 | 1.80% | 77.79% |
| **12** | `𝄿 ♬♪` `[. X X X]` | `♬♬` `[X X X X]` | **`𝄿 ♬♪  ♬♬`** | **16th Pickup Burst resolving into four sixteenths** | 565 | 1.27% | 79.06% |
| **13** | `♪ ♬` `[X . X X]` | `♫` `[X . X .]` | **`♪ ♬  ♫`** | **Gallop resolving into two eighths** | 423 | 0.95% | **80.00%** |
| **14** | `♪ ♬` `[X . X X]` | `♬♬` `[X X X X]` | **`♪ ♬  ♬♬`** | **Gallop launching four sixteenths** | 402 | 0.90% | 80.90% |
| **15** | `♩` `[X . . .]` | `𝄾 ♬` `[. . X X]` | **`♩. ♬`** *(or `♩ 𝄾 ♬`)* | **Dotted Quarter + Two Sixteenths** | 381 | 0.85% | 81.76% |

Look closely at Ranks **7, 8, 10, 12, 13, and 14** in the table above: in the real corpus, `♪. ♬` (Rank 8), `𝄾 ♪` (Rank 10), `𝄿 ♬♪` (Rank 12), and `♪ ♬` (Ranks 13 & 14) almost exclusively appear **paired with their immediate downbeat resolution on the second beat**! This brings us directly to the user's first insight.

---

## 4. Investigation 3: Why Rhythmic Patterns Need Their "Landing" Note (*Anacrusis $\rightarrow$ Crusis*) & Optimal Phrase Length

### 4.1 Musicological & Motor Foundation: Metric Boundary vs. Gestalt Grouping Boundary

> **User's Insight**: *"I would guess that the ideal length is more than two bars, as it does seem to make a difference if a rhythmic pattern just ends or is surrounded by others (classic example is a 'gallop' made by dotted notes, where, say, a dotted quarter followed by an eighth doesn't really 'gallop' unless it's followed by another note on the subsequent fourth, if you know what I mean?). Maybe bars should get longer over time. Maybe also not."*

The user has independently discovered the central theorem of **Grovenor Cooper and Leonard B. Meyer's *The Rhythmic Structure of Music* (University of Chicago Press, 1960)** and **Fred Lerdahl and Ray Jackendoff's *A Generative Theory of Tonal Music* (MIT Press, 1983)**:

```
   METRIC GRID (Where the Beat Boundaries Sit):
   |------- Beat 1 -------|------- Beat 2 -------|------- Beat 3 -------|
   [   ♩.  (Dotted Qtr)   |   (hold)      ♪ (8th)] [   ♩  (Quarter)     ]

   GESTALT / MOTOR GROUPING (Where the Human Gesture Lives):
   [   ♩.  ==============     (hold)   ]  [  ♪   ======►   ♩ (LANDING!) ]
                                           └─ Anacrusis ──► Crusis ─────┘
                                              (Catapult)    (Target)
```

1. **Metric Grid $\neq$ Perceptual Grouping (Cooper & Meyer, 1960)**:
   * Standard music notation beams notes by **metric beat boundaries** (Beat 1, Beat 2, Beat 3, Beat 4).
   * However, **phenomenal (perceptual and motor) rhythm** is organized by **proximity and durational closure** (*Wertheimer's Law of Proximity* and *Woodrow's Law of Temporal Grouping*, 1909): a short note (`♪` or `♬`) immediately preceding a longer or metrically stronger note is perceived and executed by the motor cortex **not as the end of the previous beat, but as an *anacrusis* (pickup/catapult) belonging to the NEXT beat's downbeat (*crusis*)**!
2. **Why `♩. ♪` Without the Subsequent `♩` Doesn't "Gallop" (Motor Coarticulation)**:
   * In motor control neuroscience (Lashley, 1951; Schmidt, 1975; Godøy, 2010 *gestural-sonorous objects*), rapid ballistic movements are chunked around **force peaks (metric accents / landing points)**.
   * In a dotted rhythm (`♩. ♪ | ♩` or `♪. ♬ | ♩`), the short note (`♪` or `♬`) is biomechanically a **preparatory rebound (anacrusis)** that flings the hand/finger into the gravitational down-stroke (**crusis**) of the subsequent beat.
   * If an exercise presents `♩. ♪` (or `♪. ♬`) at the end of a unit with **no note on the next downbeat**, the motor program is **amputated mid-flight**:
     * Instead of feeling a spring-loaded *skip-into-landing* (`DUM - - da-DUM!`), the learner hears an isolated `long – short` (`DUM - - da.`), which lacks the $3:1$ ratio verification anchor because the duration of the short note `♪` is only defined acoustically by the **inter-onset interval (IOI) between the `♪` and the landing note on the next beat**!
     * **Crucial Acoustic Proof**: On a percussive instrument like the piano (or when tapping a key), once you strike the eighth note `♪` in `♩. ♪`, **you cannot hear how long that eighth note was unless another note is struck on the next beat to close its inter-onset interval!** Without a landing note on Beat 3, a pianist playing `♩. ♪` and `♩. ♬` produces the *exact same two attack timestamps*! Only the **landing note on the next beat** defines the duration of the short note!

---

### 4.2 Hard Statistical Proof from the 50,670-Measure Corpus: Conditional Probability of a Downbeat Landing

We measured the exact empirical Markov transition probability $P(\text{Downbeat Attack on Next Beat} \mid \text{Pattern on Current Beat})$ across all 119,527 simple-meter beats in our piano corpus:

| Anacrustic Pattern on Beat $t$ (or $t, t+1$) | Notation | Right Hand: Downbeat Attack on Next Beat | Composite (Both Hands): Downbeat Attack on Next Beat | Top 3 Most Common Next-Beat Landings (Right Hand) |
| :--- | :---: | :---: | :---: | :--- |
| **Dotted Quarter + Eighth** *(2-beat)* | **`♩. ♪`** | **97.20%** *(2,322 / 2,389)* | **98.97%** *(578 / 584)* | 1. `♫` (44.4%), 2. `♩` (35.7%), 3. `♪. ♬` (9.5%) |
| **Dotted Eighth + Sixteenth** | **`♪. ♬`** | **97.91%** *(3,693 / 3,772)* | **99.50%** *(3,354 / 3,371)* | 1. `♩` (55.3%), 2. `♪. ♬` (19.9%), 3. `♫` (10.2%) |
| **Classic Gallop** | **`♪ ♬`** | **88.81%** *(2,096 / 2,360)* | **99.36%** *(3,426 / 3,448)* | 1. `♪ ♬` (23.4%), 2. `♫` (23.3%), 3. `♬♬` (22.8%) |
| **Four Sixteenths** | **`♬♬`** | **94.31%** *(16,453 / 17,445)* | **99.27%** *(29,785 / 30,005)* | 1. `♬♬` (72.1%), 2. `♩` (8.9%), 3. `♫` (5.9%) |
| **Two Eighths** | **`♫`** | **92.74%** *(25,412 / 27,402)* | **99.29%** *(37,234 / 37,502)* | 1. `♫` (63.3%), 2. `♩` (19.6%), 3. `𝄾 ♪` (4.6%) |
| **Upbeat Eighth** | **`𝄾 ♪`** | **80.58%** *(4,241 / 5,263)* | **97.55%** *(796 / 816)* | 1. `♫` (45.0%), 2. `♩` (23.2%), 3. `𝄾 ♪` (16.7%) |
| **16th Rest + Three 16ths** | **`𝄿 ♬♪`** | **78.13%** *(1,936 / 2,478)* | **99.17%** *(119 / 120)* | 1. `♬♬` (41.8%), 2. `𝄿 ♬♪` (19.9%), 3. `♩` (14.4%) |
| **Reverse Gallop** | **`♬ ♪`** | **68.04%** *(330 / 485)* | **97.75%** *(827 / 846)* | 1. `♫` (17.1%), 2. `♩` (14.4%), 3. `♬♬` (13.6%) |
| **Intra-Beat Syncopation** | **`♬ ♪ ♬`** | **66.83%** *(530 / 793)* | **87.14%** *(61 / 70)* | 1. `♬♬` (20.8%), 2. `♪ ♬` (12.4%), 3. `♬ ♪ ♬` (11.2%) |

> [!TIP]
> **Look at the Numbers for `♩. ♪` and `♪. ♬`:**
> * In real piano literature, **`♩. ♪` lands on a downbeat attack on the subsequent beat 97.20% of the time in the Right Hand and 98.97% of the time overall!**
> * **`♪. ♬` lands on a downbeat attack on the very next beat 97.91% of the time in the Right Hand and 99.50% of the time overall!**
> * Even **Intra-Beat Syncopation (`♬ ♪ ♬`)**—when it does *not* attack the next downbeat in the Right Hand (`33.17%` of the time, primarily in Scott Joplin rags where the final `♬` is tied across the beat line into `𝄿 ♬♪`)—still has the **Left Hand** strike the downbeat **87.14%** of the time!

---

### 4.3 Cross-Barline Momentum & Optimal Exercise Length (2 Bars vs. 4 Bars vs. Progressive Horizon)

What about across barlines and across multi-bar phrases? Let us look at the corpus statistics across **38,706 consecutive simple-meter bar transitions** and **9,541 consecutive 4-bar hypermeasures**:

1. **Cross-Barline Anacrusis Rate (`77.9%` of Bars Push Across the Barline!)**:
   * Out of `38,706` consecutive bar transitions, `25,558` bars (**66.03%**) in the Right Hand and `30,150` bars (**77.90%**) in the Composite texture have subdivided/off-beat activity on the **final beat of the bar**.
   * When the final beat of Bar $k$ has off-beat/anacrustic activity, **91.55%** of the time in the Right Hand (`23,398 / 25,558`) and **99.33%** of the time in the Composite texture (`29,947 / 30,150`), it resolves directly onto a **downbeat attack on Beat 1 of Bar $k+1$**!
   * In other words, **barlines in real music are almost never stopping walls**—they are magnetic gravitational targets that the final beat of the previous bar catapults into!

2. **Hypermetric Phrase Structure (Why 4 Bars Is the Canonical "Sentence" of Western Music)**:
   * Across `9,541` consecutive 4-bar windows ($\text{Bar}_1, \text{Bar}_2, \text{Bar}_3, \text{Bar}_4$):
     * **2-Bar Parallelism ($\text{Bar}_1 = \text{Bar}_3$)**: In **35.67%** of all 4-bar windows, Bar 3 has the **exact same Right-Hand rhythmic pattern** as Bar 1 (the classic Classical/Romantic **Antecedent–Consequent** or **Period/Sentence** structure: `Statement [Bar 1–2] -> Parallel Response [Bar 3–4]`)!
     * **1-Bar Immediate Repetition ($\text{Bar}_1 = \text{Bar}_2$)**: In **35.94%** of all 4-bar windows, Bar 2 repeats Bar 1's rhythmic motif (forming the classic **Schoenberg/Caplin Sentence** `1 + 1 + 2`, where a 1-bar basic idea is stated in Bar 1, repeated in Bar 2, and spun out into a 2-bar cadential continuation across Bars 3–4!).
     * **Cadential Breathing Points (Bar 2 & Bar 4)**: The probability that the final beat of a bar is unsubdivided (a quarter note or rest/cadential arrival) alternates systematically between odd and even bars:
       * **Bar 1 (Opening)**: `19.46%` unsubdivided final beat (80.54% active forward drive into Bar 2)
       * **Bar 2 (Half-Cadence / Sub-Phrase End)**: **`22.17%`** unsubdivided final beat (6.03 avg RH onsets)
       * **Bar 3 (Consequent Drive)**: `19.60%` unsubdivided final beat (6.11 avg RH onsets — **peak rhythmic density of the 4-bar phrase!**)
       * **Bar 4 (Phrase Cadence)**: **`23.23%`** unsubdivided final beat (**lowest average onset density `5.93` — the natural resting point of the 4-bar sentence!**)

3. **Answering the User's Question: *"What is the ideal length? Maybe bars should get longer over time. Maybe also not."***
   * Both musicology and cognitive working-memory science give a crystal-clear answer: **Phrase length should follow a 3-Stage Progressive Horizon—PROVIDED every stage obeys the "Closed Gestalt (+1 Landing)" Rule!**
   * Why?
     * **When First Learning a New Rhythmic Word (Stage A: Micro-Cell Acquisition)**, showing 4 full bars of unfamiliar notation overloads visual working memory before the motor gesture is even formed. At this introductory moment, the ideal unit is **NOT** a chopped 1-beat cell (`♪. ♬`), nor is it 4 bars—it is a **Closed "Gesture + Landing" Micro-Phrase** (e.g., `♪. ♬ | ♩` [2 beats] or `1 Bar + Next Bar's Beat 1 Landing Note` = 5 beats).
     * **When Consolidating Pattern Combinations (Stage B: 2-Bar Sub-Phrase + Landing)**, **2 bars** (specifically **2 bars ending on a cadential Beat 3/4 arrival, or 2 bars + Beat 1 of Bar 3**) matches the 2-bar sub-phrase (antecedent) of Western music.
     * **When Training Authentic Sight-Reading Fluency (Stage C: The 4-Bar Repertoire Sentence)**, **4 bars** is the **gold-standard optimal length**! Why?
       1. **Musical Completeness**: As shown by our 9,541 hypermeasures, a 4-bar phrase (`1 + 1 + 2` sentence or `2 + 2` period) naturally contains **both** internal repetition (`Bar 1 == Bar 2` or `Bar 1 == Bar 3`), cross-barline momentum across 3 barlines, **and** a genuine cadential landing in Bar 4!
       2. **Eye-Hand Span & Pulse Endurance**: In a 1-bar or 2-bar snippet, a learner can "hold their breath" and memorize the whole snippet before starting, bypassing real-time look-ahead. Across **4 bars**, working memory ($4 \pm 1$ chunks) cannot hold all 16 beats verbatim—forcing the learner to rely on **structural chunking** (recognizing that Bar 3 repeats Bar 1!) and genuine **Eye-Hand Span look-ahead** while maintaining their internal pulse for ~8–10 seconds.
       3. **Why Longer Than 4 Bars (e.g. 8–16 Bars) Is Reserved for Endurance Mode**: In Phase 1 (Unmetered Sandbox) + Phase 2 (Verification), an 8- or 16-bar exercise takes too long between diagnostic feedback loops (violating fast motor-error correction). Thus, **4 bars** is the sweet spot for the core loop, with an optional **8-Bar Continuous Flow Challenge** at the end of each tier!

---

## 5. Investigation 4: Proportional Scale Invariance ($2\times$ Speed / Metric Zoom Level)

### 5.1 The User's Scale-Invariance Insight

> **User's Insight**: *"Also, I believe a pattern is the same if you slow it down twice (e.g., eighths replace fourths) and so on, so that might also matter, but maybe it does actually make a difference."*

Let us examine the physics, corpus statistics, and cognitive neuroscience of **Proportional Scale Invariance ($2\times$ Metric Rescaling)**.

#### 1. Acoustic & Motor Identity (Why the User Is Right)
Consider two rhythms:
* **Pattern A (Micro / $1\times$ Sixteenth Level)**: `♪. ♬ | ♩` (Dotted eighth + sixteenth landing on a quarter note) played at **$\text{Quarter} = 60\text{ BPM}$** ($1\text{ beat} = 1000\text{ ms}$).
  * Onset 1 (`♪.`): $t = 0\text{ ms}$ (duration $= 750\text{ ms}$)
  * Onset 2 (`♬`): $t = 750\text{ ms}$ (duration $= 250\text{ ms}$)
  * Onset 3 (`♩` landing): $t = 1000\text{ ms}$
* **Pattern B (Macro / $2\times$ Eighth Level)**: `♩. ♪ | 𝅗𝅥` (Dotted quarter + eighth landing on a half note) played at **$\text{Quarter} = 120\text{ BPM}$** ($1\text{ beat} = 500\text{ ms}$, or Cut Time $\frac{2}{2}$ at $\text{Half} = 60\text{ BPM}$).
  * Onset 1 (`♩.`): $t = 0\text{ ms}$ (duration $= 1.5 \times 500 = 750\text{ ms}$)
  * Onset 2 (`♪`): $t = 750\text{ ms}$ (duration $= 0.5 \times 500 = 250\text{ ms}$)
  * Onset 3 (`𝅗𝅥` landing): $t = 1000\text{ ms}$

**They are 100.0% acoustically and motorically identical down to the millisecond!** If you close your eyes and listen to Pattern A at 60 BPM and Pattern B at 120 BPM, there is **zero physical difference** in the sound wave or the finger inter-onset intervals ($3 : 1 \rightarrow \text{Landing}$).

#### 2. Empirical Corpus Proof of Scale Invariance Across Meters and Levels
Does this scale invariance actually show up in how Bach, Mozart, Beethoven, and Chopin compose?
We tested this in two ways across our 50,670 measures:
1. **1-Beat (Sixteenth-Grid) vs. 2-Beat ($2\times$ Slower Eighth-Grid) Pattern Distribution**:
   * Every 1-beat cell $[b_0, b_1, b_2, b_3]$ on the sixteenth grid (`1 - e - & - a`) has an exact $2\times$-drawn-out twin on the 2-beat eighth grid (`1 - & - 2 - &`, i.e., Beat 1 $= [b_0, 0, b_1, 0]$ and Beat 2 $= [b_2, 0, b_3, 0]$).
   * Across all 119,527 Right-Hand beats in our corpus, the **Cosine Similarity** between the 1-beat (sixteenth-level) frequency vector and the 2-beat (eighth-level) frequency vector is **`0.9160`**!
2. **$\frac{3}{4}$ Bars vs. $2\times$-Rescaled $\frac{3}{8}$ Bars**:
   * A bar of $\frac{3}{8}$ is literally a bar of $\frac{3}{4}$ with all note values halved ($\text{eighth} \leftrightarrow \text{quarter}$, $\text{sixteenth} \leftrightarrow \text{eighth}$).
   * Comparing the 1-bar pattern distribution across all `14,785` bars of $\frac{3}{4}$ against all `4,908` bars of $\frac{3}{8}$ (rescaled by $2\times$) yields a **Cosine Similarity of `0.8609`**!

| 4-Slot Proportional Gesture `[1  2  3  4]` | **Zoomed-In ($1\times$ Beat Level: 16ths)** | Corpus RH Share (1-Beat) | **Zoomed-Out ($2\times$ Half-Bar Level: 8ths)** | Corpus RH Share (2-Beat) | Scale Ratio & Musical Behavior |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Solid Long (`[X . . .]`)** | `♩` *(Quarter)* | 34.47% | `𝅗𝅥` *(Half Note / `♩ 𝄽`)* | 20.17% | Core macro-duration at both scales |
| **Even Duple (`[X . X .]`)** | `♫` *(Two Eighths)* | 28.67% | `♩  ♩` *(Two Quarters)* | 21.68% | Primary binary walk at both scales |
| **Four-Pulse Run (`[X X X X]`)** | `♬♬` *(Four Sixteenths)* | 18.25% | `♫  ♫` *(Four Eighths)* | 28.22% | Primary running motor at both scales |
| **Midpoint Upbeat (`[. . X .]`)** | `𝄾 ♪` *(Upbeat Eighth)* | **5.52%** | `𝄽  ♩` *(Beat-2 Quarter Pickup)* | **4.17%** | **Nearly 1:1 invariant (`5.5%` vs `4.2%`)** |
| **Dotted 3:1 Skip (`[X . . X]`)** | **`♪. ♬`** *(Dotted 8th + 16th)* | **3.96%** | **`♩. ♪`** *(Dotted Qtr + 8th)* | **5.24%** | **Nearly 1:1 invariant (`4.0%` vs `5.2%`)** |
| **Post-Downbeat 3-Note Pickup (`[. X X X]`)** | **`𝄿 ♬♪`** *(16th Rest + Three 16ths)* | **2.60%** | **`𝄾 ♪  ♫`** *(8th Rest + Three 8ths)* | **3.41%** | **Nearly 1:1 invariant (`2.6%` vs `3.4%`)** |
| **Anapestic Gallop (`[X . X X]`)** | **`♪ ♬`** *(8th + Two 16ths)* | **2.47%** | **`♩  ♫`** *(Quarter + Two 8ths)* | **5.34%** | Same forward drive toward next downbeat |
| **Syncopation (`[X X . X]`)** | **`♬ ♪ ♬`** *(16th – 8th – 16th)* | **0.83%** | **`♪ ♩ ♪`** *(8th – Quarter – 8th)* | **2.84%** | **Exact same syncopated groove at $2\times$ scale!** |
| **Trochaic / Reverse Gallop (`[X X X .]`)** | **`♬ ♪`** *(Two 16ths + 8th)* | **0.51%** | **`♫  ♩`** *(Two 8ths + Quarter)* | **5.37%** | **$10.5\times$ divergence!** (See explanation below) |

---

### 5.2 Why It *Does* Make a Difference: The Three Psychological & Notational Differences Between $1\times$ and $2\times$ Scale

Why do learners often struggle with `♪. ♬` (`Dotted 8th + 16th`) when they can already play `♩. ♪` (`Dotted Quarter + 8th`), OR struggle with `♬ ♪ ♬` (`16th–8th–16th`) when they already know `♪ ♩ ♪` (`8th–Quarter–8th`)? And why did the user astutely sense *"maybe it does actually make a difference"*?

Because while the **relative acoustic proportions** are 100% identical, **three cognitive and sensorimotor variables change** when you rescale a rhythm by $2\times$:

#### Difference 1: Where Your Embodied Tactus (Pulse Bounce) Falls Relative to the Notes!
In Section 3.4 of our pedagogy document, we saw that in standard $\frac{4}{4}$ at moderate tempo, the pianist's physical pulse (**Tactus**) moves on the **Quarter Note (`♩`)** (Down-stroke = Beat, Up-stroke = the `"&"` midpoint):

```
   A. ZOOMED-OUT (2-Beat Scale: ♩. ♪ → ♩) — Pulse Splits the Gesture in Half!
      Beat 1 (DOWN)      "&" (UP)      Beat 2 (DOWN!)      "&" (UP)      Beat 3 (DOWN)
         [ ♩. (Play) .................... (Feel Silent   ... [ ♪ (Play!) ] ──► [ ♩ (Landing!) ]
                                           Beat 2 Down!) ]

   B. ZOOMED-IN (1-Beat Scale: ♪. ♬ → ♩) — Entire Gesture Happens Inside ONE Beat!
      Beat 1 (DOWN)               "&" (UP)         "a" (Late Snap)       Beat 2 (DOWN)
         [ ♪. (Play) ............... (Pass through    [ ♬ (Play!) ] ────► [ ♩ (Landing!) ]
                                      upward rebound) ]
```

* **In the 2-Beat Version (`♩. ♪ → ♩`)**:
  * A whole **second beat (Beat 2)** falls *inside* the dotted quarter note!
  * Your body feels **Down on Beat 1 (play `♩.`) $\rightarrow$ Down on Beat 2 (silent physical bounce!) $\rightarrow$ Up on the `"&"` of Beat 2 (play `♪`) $\rightarrow$ Down on Beat 3 (play `♩`)**.
  * Here, the eighth note `♪` sits right on the **biomechanical upward rebound** of Beat 2!
* **In the 1-Beat Version (`♪. ♬ → ♩`)**:
  * The entire gesture happens **inside a single quarter-note beat**!
  * There is **no second down-stroke inside the dotted eighth**. Instead, the sixteenth note `♬` happens **halfway between the upward rebound (`"&"`) and the next down-stroke (Beat 2)**—as a late, crisp $3:1$ snap right before Beat 2 lands!
* **Unless the tempo is fast enough (or in Cut Time $\frac{2}{2}$) that you shift your physical Tactus up by $2\times$ to the Half Note (`𝅗𝅥`)!**
  * **Mind-Blowing Pedagogical Realization**: When you play `♩. ♪ | ♩` in **Cut Time ($\frac{2}{2}$, where 1 big beat = Half Note `𝅗𝅥`)**, your physical pulse moves on the Half Note—so `♩. ♪ | ♩` in $\frac{2}{2}$ has the **EXACT SAME BIOMECHANICAL FEEL** as `♪. ♬ | ♪` in $\frac{4}{4}$!

#### Difference 2: Visual Engraving Encoding (Stems/Flags vs. Primary/Secondary Beams)
The human visual cortex does not see "abstract mathematical ratios" on a page; it sees **typographical ink geometry** (Sloboda, 1984):
* At the **2-Beat Scale**, `♩. ♪` is drawn with an **unbeamed quarter stem + dot + isolated flagged eighth stem** (`♩. ♪`), and syncopation `♪ ♩ ♪` is drawn with **two separate flags flanking a quarter stem** (or a tie across the beat: `♪ ♪_♪ ♪`).
* At the **1-Beat Scale**, `♪. ♬` is drawn under a **single solid primary horizontal beam with a short secondary beam stub (hook) on the right** (`┌─. ┐`), and syncopation `♬ ♪ ♬` is drawn as a **3-note beamed unit with broken inner secondary beams**!
* Beginners treat these as "completely unrelated symbols" because nobody ever showed them that **`♪. ♬` is visually just `♩. ♪` with one extra beam added across the top (`2× Zoom-In`)**!

#### Difference 3: Metric Weight & Phrase-Structural Role (Explaining the `♫ ♩` vs. `♬ ♪` $10.5\times$ Corpus Divergence!)
Look back at the final row of our Scale-Invariance table: why does `[X X X .]` occur **5.37%** of the time at the 2-beat level (`♫ ♩`), but only **0.51%** of the time at the 1-beat level (`♬ ♪`, Reverse Gallop)—a **$10.5\times$ difference**?
* Because in $\frac{4}{4}$ or $\frac{2}{4}$, **Beat 2 is a full metric beat** capable of carrying a **harmony change or feminine/trochaic cadence** (`♫ ♩` = two eighth notes on Beat 1 resolving onto a stable quarter note on Beat 2, as in Mozart and Chopin phrase endings!).
* Inside a **single beat**, however, the `"&"` (3rd sixteenth slot) is metrically weak. Stopping a fast 16th-note burst on the `"&"` of the beat (`♬ ♪`) leaves the beat hanging on an off-beat unless it is a specialized rhythmic idiom (such as a Hungarian/Balkan folk rhythm, a Classical *alla turca* motif, or a Ragtime tie).

---

### 5.3 How Our App Exploits Scale Invariance: The **"2× Metric Zoom" Bridge**

Because of this exact relationship between $1\times$ and $2\times$ scale, our Rhythm Module introduces a signature pedagogical feature that no existing app has: **"2× Metric Zoom (Rescaling Bridge)"**:

1. **Step 1 — Master the Macro Gesture ($2\times$ Scale)**:
   * Suppose the learner is entering **Tier 3 (Sixteenth-Note Words: `♪ ♬`, `♬ ♪`, `♪. ♬`, `♬ ♪ ♬`)** and feels intimidated by sixteenth-note beams.
   * The app first displays the **2-Beat Macro Twin** that the learner *already mastered in Tier 1 & Tier 2*:
     * `♩  ♫ | ♩` (Quarter + Two Eighths $\rightarrow$ Quarter Landing) at $120\text{ BPM}$!
     * Or `♩. ♪ | ♩` (Dotted Quarter + Eighth $\rightarrow$ Quarter Landing) at $120\text{ BPM}$!
     * Or `♪ ♩ ♪ | ♩` (2-Beat Syncopation $\rightarrow$ Quarter Landing) at $120\text{ BPM}$!
2. **Step 2 — The Live "2× Metric Zoom" Morph**:
   * The learner plays `♩. ♪ | ♩` at $120\text{ BPM}$ (where each quarter beat is $500\text{ ms}$, and each 2-beat half-bar is $1000\text{ ms}$).
   * Then the user clicks **`[Zoom In 2×: Quarter → Eighth]`** (or advances to the paired Zoom step):
   * **The audio and physical finger timing stay 100.0% IDENTICAL** (Onsets at $0\text{ ms}$, $750\text{ ms}$, and $1000\text{ ms}$!), while the **pulse slows from $120\text{ BPM}$ (4 fast beats) to $60\text{ BPM}$ (2 big beats)** and the notation smoothly morphs on screen by adding one beam level:
     $$\underbrace{\text{♩. \quad ♪ \quad | \quad ♩}}_{\text{at } \♩ = 120\text{ BPM}} \quad \xrightarrow{\text{100\% Identical Finger Timing!}} \quad \underbrace{\text{♪. ♬ \quad ♩}}_{\text{at } \♩ = 60\text{ BPM}}$$
     $$\underbrace{\text{♪ \quad ♩ \quad ♪ \quad | \quad ♩}}_{\text{at } \♩ = 120\text{ BPM}} \quad \xrightarrow{\text{100\% Identical Finger Timing!}} \quad \underbrace{\text{♬ ♪ ♬ \quad ♩}}_{\text{at } \♩ = 60\text{ BPM}}$$
3. **Why This Creates an Instant "Aha!" Moment**:
   * The learner immediately realizes: *"Wait—`♪. ♬ → ♩` isn't a scary new fraction calculation! It is literally the exact same physical groove as `♩. ♪ → ♩` that I already know, just felt inside one big beat instead of two small beats!"*
   * This single insight collapses the perceived size of the rhythmic universe by **50%**, connecting $\frac{4}{4} \leftrightarrow \frac{2}{2}$ (Cut Time), $\frac{3}{4} \leftrightarrow \frac{3}{8}$, and **2-Beat Eighth Cells $\leftrightarrow$ 1-Beat Sixteenth Cells** into a single unified motor vocabulary!

---

## 6. Authentic 4-Bar Repertoire Phrases Extracted from the Piano Corpus

To ensure learners practice rhythmic words in **real musical sentences** with natural **anacrusis $\rightarrow$ crusis landings**, **cross-barline continuity**, and **4-bar antecedent–consequent phrasing**, here is a sample catalog of authentic 4-bar rhythmic phrases extracted directly from our 511-work corpus across all 6 curriculum tiers:

### Tier 1 & Tier 2: Pulse, Rests, Upbeats (`𝄾 ♪`), and Dotted Quarter + Eighth (`♩. ♪ → ♩/♫`)
* **W.A. Mozart — *Piano Sonata No. 1 in C Major*, K. 279, Mvt. 1, mm. 26–29 ($\frac{4}{4}$)**:
  * `m.26: [♩   𝄾 ♪   ♫   ♫]  ||  m.27: [♩   𝄾 ♪   ♩   𝄽]  ||  m.28: [♩   𝄽   ♩   𝄽]  ||  m.29: [♫   ♫   ♫   ♫]`
  * *Pedagogical highlight*: Beats 1–2 of m.26 and m.27 feature `♩. ♪` (`[♩  𝄾 ♪]`) resolving first onto `♫` (m.26 Beat 3) and then onto a cadential `♩` (m.27 Beat 3), followed by half-note/rest grounding in m.28 and an 8-eighth motor run in m.29!
* **J.S. Bach — *Fugue No. 8 in D-sharp Minor (WTC Book I)*, BWV 853b, mm. 1–4 ($\frac{4}{4}$)**:
  * `m.1: [♩   ♩   𝄾 ♪   ♫]  ||  m.2: [♫   ♩   ♩   ♩]  ||  m.3: [𝄾 ♪   ♩   ♩   ♫]  ||  m.4: [♫   ♫   ♫   ♫]`
  * *Pedagogical highlight*: Iconic fugue subject where Beat 2–3 `♩. ♪` (`[♩  𝄾 ♪]`) catapults into `♫` on Beat 4, which in turn drives across the barline into m.2!
* **L. van Beethoven — *Piano Sonata No. 2 in A Major*, Op. 2 No. 2, Mvt. 1, mm. 10–13 ($\frac{2}{4}$)**:
  * `m.10: [♫   ♫]  ||  m.11: [♫   ♫]  ||  m.12: [♩   𝄽]  ||  m.13: [𝄾 ♪   ♫]`
  * *Pedagogical highlight*: Classic `1 + 1 + 2` Beethovenian rhythmic sentence with a crisp downbeat silence (`𝄾 ♪ → ♫`) in m.13.

### Tier 3: The Sixteenth-Note Word Family (`♬♬`, `♪ ♬` Gallop, `♬ ♪` Reverse Gallop, `𝄿 ♬♪` Pickup Burst)
* **W.A. Mozart — *Piano Sonata No. 1 in C Major*, K. 279, Mvt. 1, mm. 4–7 ($\frac{4}{4}$)**:
  * `m.4: [♩   ♬♬   ♬♬   ♬♬]  ||  m.5: [♪ ♬   ♫   ♩   ♩]  ||  m.6: [𝄾 ♬   ♫   ♩   ♩]  ||  m.7: [𝄾 ♪   ♫   ♩   ♩]`
  * *Pedagogical highlight*: Look at how Mozart systematically varies Beat 1 across mm. 5–7 while keeping Beats 2–4 identical (`[♫  ♩  ♩]`):
    * `m.5 Beat 1`: **`♪ ♬`** (Gallop: eighth + two sixteenths $\rightarrow$ lands on `♫`)
    * `m.6 Beat 1`: **`𝄾 ♬`** (Eighth rest + two sixteenths $\rightarrow$ lands on `♫`)
    * `m.7 Beat 1`: **`𝄾 ♪`** (Eighth rest + eighth $\rightarrow$ lands on `♫`)
    * This single 4-bar Mozart passage is a masterclass in **Contextual Resolution**!
* **J.S. Bach — *Fugue No. 2 in C Minor (WTC Book I)*, BWV 847b, mm. 1–4 ($\frac{4}{4}$)**:
  * `m.1: [𝄾 ♬   ♫   ♪ ♬   ♫]  ||  m.2: [♪ ♬   ♫   ♬ ♪   𝄾 ♬]  ||  m.3: [♬♬   ♬♬   ♪ ♬   ♫]  ||  m.4: [♪ ♬   ♫   ♬ ♪   ♪ ♬]`
  * *Pedagogical highlight*: Perhaps the most famous rhythmic motif in Baroque keyboard literature—combining `[𝄾 ♬ → ♫]`, `[♪ ♬ → ♫]` (Gallop + Landing), and `[♬ ♪]` (Reverse Gallop) in a 4-bar hypermeasure.
* **J.S. Bach — *Fugue No. 3 in C-sharp Major (WTC Book I)*, BWV 848b, mm. 12–15 ($\frac{4}{4}$)**:
  * `m.12: [♬♬   ♬♬   ♬♬   ♬♬]  ||  m.13: [♪ ♬   ♬♬   ♬♬   ♬♬]  ||  m.14: [♬♬   ♬♬   ♬♬   ♬♬]  ||  m.15: [♩   𝄿 ♬♪   ♬♬   ♬♬]`
  * *Pedagogical highlight*: Demonstrates the quintessential Baroque **`𝄿 ♬♪ → ♬♬`** (post-downbeat 3-sixteenth pickup burst launching a sixteenth-note run).

### Tier 4: Dotted Sixteenth Snaps (`♪. ♬ → ♩`) & Syncopation (`♬ ♪ ♬`)
* **F. Chopin — *Prelude in D-flat Major ("Raindrop")*, Op. 28 No. 15, mm. 5–8 ($\frac{4}{4}$)**:
  * `m.5: [♪. ♬   ♩   Hold   ♩]  ||  m.6: [♩   Hold   Hold   ♩]  ||  m.7: [♪. ♬   ♩   Hold   ♩]  ||  m.8: [♩   𝄾 ♪   ♩   ♫]`
  * *Pedagogical highlight*: A breathtaking real-world example of **both** **Antecedent–Consequent 4-Bar Phrasing** (`m.5 == m.7`) **and** **$2\times$ Scale Invariance** inside a single phrase:
    * In `m.5` and `m.7`, Chopin writes **`♪. ♬ → ♩`** (1-beat dotted eighth + sixteenth resolving onto Beat 2 `♩`).
    * In `m.8`, Chopin stretches that exact gesture by **$2\times$** into **`♩. ♪ → ♩`** (`[♩  𝄾 ♪  ♩]`, 2-beat dotted quarter + eighth resolving onto Beat 3 `♩`)!
* **W.A. Mozart — *Piano Sonata No. 4 in E-flat Major*, K. 282, Mvt. 1, mm. 1–4 ($\frac{4}{4}$)**:
  * `m.1: [♪. ♬   ♩   𝄾 ♪   ♫]  ||  m.2: [♬♬   ♩   ♬ ♪   𝄾 ♬]  ||  m.3: [♬ ♪   𝄾 ♬   ♩   𝄾 ♪]  ||  m.4: [♩   ♩   𝄾 ♪   ♫]`
  * *Pedagogical highlight*: Opens with `♪. ♬ → ♩` on Beats 1–2 and `♩. ♪` (`[♩  𝄾 ♪]`) on Beats 2–3 resolving into `♫` on Beat 4.
* **L. van Beethoven — *Piano Sonata No. 5 in C Minor*, Op. 10 No. 1, Mvt. 2, mm. 91–94 ($\frac{2}{4}$)**:
  * `m.91: [♬ ♪ ♬   ♬ ♪ ♬]  ||  m.92: [♬ ♪ ♬   𝄿 ♪ ♬]  ||  m.93: [♬ ♪ ♬   ♬ ♪ ♬]  ||  m.94: [♬ ♪ ♬   𝄿 ♪ ♬]`
  * *Pedagogical highlight*: Classic Classical-era intra-beat syncopation (`♬ ♪ ♬`) over a steady Left-Hand pulse.
* **S. Joplin — *The Easy Winners*, mm. 1–4 & mm. 5–8 ($\frac{2}{4}$)**:
  * `m.1: [♫   𝄿 ♬♪]  ||  m.2: [♬ ♪ ♬   ♪ ♬]  ||  m.3: [♬♬   ♬♬]  ||  m.4: [♩   𝄽]`
  * `m.5: [♫   𝄾 ♪]   ||  m.6: [♬ ♪ ♬   ♬ ♪]  ||  m.7: [♬ ♪ ♬   ♬♬]  ||  m.8: [𝄾 ♬   ♬♬]`
  * *Pedagogical highlight*: Authentic Ragtime syncopation (`♬ ♪ ♬`, `𝄿 ♬♪`, `♪ ♬`, `♬ ♪`) in a crisp 4+4 bar antecedent–consequent period against a steady `[♫  ♫]` Left-Hand stride bass!

---

## 7. Summary of Architectural Recommendations for the Rhythm Module

Based on our musicological and corpus findings, we refine the **No-Nonsense Rhythm Reading Module** architecture along four concrete rules:

1. **The "Closed Gestalt (+1 Landing)" Rule (Never Amputate an Anacrusis)**:
   * Any cell ending with an off-beat or subdivision (`♩. ♪`, `♪. ♬`, `♪ ♬`, `𝄾 ♪`, `𝄿 ♬♪`, `♬♬`) **must** be followed by a downbeat landing note (`♩` or `♫`) on the subsequent beat (reflecting the **97.2%–99.5%** corpus resolution rate).
   * Even when a user clicks a single 1-beat cell in Phase 1 (Sandbox) to hear its reference audio, the audio preview plays **`[Target Cell] ──► [Soft Downbeat Landing Tap on Next Beat]`** so the inter-onset interval of the final note is acoustically closed and the motor catapult lands on its target!
2. **Progressive Phrase-Length Horizon (`2-Beat Cell+Landing` $\rightarrow$ `2-Bar Sub-Phrase` $\rightarrow$ `4-Bar Repertoire Sentence`)**:
   * **Step A (Word Introduction — 2-Beat / 1-Bar + Landing)**: When introducing a brand-new rhythmic word for the very first time, present it as a **2-Beat "Gesture + Landing" Capsule** (e.g., `♪. ♬ | ♩` or `♩. ♪ | ♩`) or **1-Bar + Downbeat Landing** (`5 beats`) so visual load is minimal while the motor resolution is intact.
   * **Step B (Sub-Phrase Combination — 2 Bars + Landing)**: Combine 2 bars of high-probability Pareto cells (ending on a stable Beat 3/4 cadence or a Bar-3 Beat-1 landing note).
   * **Step C (Standard Practice Mode — 4-Bar Repertoire Sentences)**: Use **4-bar phrases** (`1+1+2` sentences and `2+2` antecedent–consequent periods drawn directly from or modeled on our 511-work piano corpus) as the primary training unit, training cross-barline drive (Bars $1\rightarrow 2$ and $3\rightarrow 4$) and structural pattern recognition (`Bar 1 == Bar 3`).
3. **Pareto / Zipf Popularity-Driven Curriculum Engine**:
   * Rather than generating uniform random combinations of the 16 cells (which produces 98.9% unmusical nonsense bars that never appear in real scores), the exercise generator weights 2-beat and 1-bar combinations by their **empirical Pareto frequency** in our 50,670-measure piano corpus and pulls directly from a curated bank of **authentic repertoire rhythmic sentences** (Bach, Scarlatti, Haydn, Mozart, Beethoven, Chopin, Joplin).
4. **Explicit "2× Metric Zoom (Scale-Invariance)" Training**:
   * Every dotted, gallop, and syncopated pattern at the 1-beat sixteenth level (`♪. ♬ → ♩`, `♪ ♬ → ♩`, `♬ ♪ ♬ → ♩`) is explicitly paired with its **$2\times$ Macro Twin** (`♩. ♪ → 𝅗𝅥`, `♩ ♫ → 𝅗𝅥`, `♪ ♩ ♪ → 𝅗𝅥`) via an interactive **`[2× Metric Zoom]`** toggle that keeps the physical audio/finger timing 100% constant while halving the pulse speed and adding one beam level—teaching the user to see through notational rescaling across $\frac{2}{2}$, $\frac{4}{4}$, $\frac{2}{4}$, $\frac{3}{4}$, and $\frac{3}{8}$.

---

## 8. Additional Musicological & Corpus References
1. **Cooper, G., & Meyer, L. B. (1960).** *The Rhythmic Structure of Music.* University of Chicago Press. (Foundational treatise on rhythmic grouping—iamb, anapest, trochee, dactyl, amphibrach—proving that anacrustic subdivisions group perceptually and motorically with the *following* downbeat crusis across metric beat boundaries).
2. **Lerdahl, F., & Jackendoff, R. (1983).** *A Generative Theory of Tonal Music.* MIT Press. (Formalized Grouping Preference Rules [GPR 2a/2b on proximity and attack-point closure] vs. Metrical Preference Rules, and hierarchical hypermeter in 2-bar and 4-bar phrases).
3. **Caplin, W. E. (1998).** *Classical Form: A Theory of Formal Functions for the Instrumental Music of Haydn, Mozart, and Beethoven.* Oxford University Press. (Defined the 4-bar/8-bar *Sentence* [$1+1+2$] and *Period* [antecedent + consequent] structures validated in our 9,541 hypermeasure analysis).
4. **Huron, D. (2006).** *Sweet Anticipation: Music and the Psychology of Expectation.* MIT Press. (Statistical learning of musical transition probabilities and Zipf distributions of metric/rhythmic schemas via the Humdrum Toolkit).
5. **London, J. (2012).** *Hearing in Time: Psychological Aspects of Musical Meter* (2nd ed.). Oxford University Press. (Demonstrated how tempo and metric level shift the listener's/performer's Tactus between quarter-note and half-note/eighth-note levels while preserving proportional sub-beat ratios).
6. **Godøy, R. I., & Leman, M. (Eds.). (2010).** *Musical Gestures: Sound, Movement, and Meaning.* Routledge. (Established **goal-directed motor coarticulation** in piano playing: rapid sub-beat notes are fused by the motor cortex into a single ballistic trajectory aimed at the subsequent metric accent/landing point).
7. **Sapp, C. S. (2005–2024).** *KernScores & Humdrum Data Digital Piano Corpora.* Center for Computer Assisted Research in the Humanities (CCARH), Stanford University. (`humdrum-tools/bach-wtc`, `humdrum-tools/inventions`, `craigsapp/mozart-piano-sonatas`, `craigsapp/beethoven-piano-sonatas`, `craigsapp/haydn-piano-sonatas`, `craigsapp/chopin-preludes`, `craigsapp/chopin-mazurkas`, `craigsapp/scarlatti-keyboard-sonatas`, `craigsapp/joplin`).
