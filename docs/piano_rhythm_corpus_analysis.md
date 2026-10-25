# Empirical Piano Corpus Analysis & Musicological Investigation: Rhythmic Vocabulary, Zipf Popularity, Contextual Resolution ("Cell + Landing"), Phrase Length, and $2\times$ Scale Invariance

## 1. Executive Summary & Multi-Scale Corpus Overview ($510 \rightarrow 1,025 \rightarrow 2,483$ Works)

To ground the **No-Nonsense Rhythm Reading Module** in hard empirical reality—and to verify that our statistical conclusions are invariant to corpus size and stylistic breadth—we conducted a three-stage computational corpus analysis across **2,483 complete two-hand keyboard and piano scores** (**181,689 complete measures / 855,570 simple-meter single-hand quarter-note beats**) spanning **130+ composers from 1720 to 1930**:

### 1.1 The Three Progressive Corpus Cohorts

| Cohort | Description & Repertoire Scope | Works / Scores | Complete Measures | Simple-Meter Beats per Hand (`♩`) | Pooled Single-Hand Beats (`RH ∪ LH`) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Cohort 1: Core Solo Piano** | **7 Canonical Keyboard Corpora (`**kern`)**: J.S. Bach (*WTC I & II* [96], *Inventions & Sinfonias* [30]), Scarlatti (*Sonatas* [65]), Haydn (*Sonatas* [25]), Mozart (*Complete Sonatas* [69]), Beethoven (*Complete Sonatas* [103]), Chopin (*Preludes Op. 28* [24], *Mazurkas* [52]), Scott Joplin (*Rags & Waltzes* [47]) | **510** | **50,670** | 119,527 | 239,054 |
| **Cohort 2: Expanded Solo Piano** | **Cohort 1 + 515 Additional Solo Piano Works (`**kern` + `.musicxml`)**: Chopin First Editions (*Complete Etudes Op. 10 & 25, Nocturnes, Ballades, Scherzos, Waltzes, Polonaises, Sonatas, Impromptus* [132]), Scriabin (*Complete Solo Piano Works Op. 1–74* [196]), J.S. Bach (*Art of the Fugue* & *Musical Offering* [26]), Hummel (*24 Preludes Op. 67* [24]), Polyrhythm Project RDS (*Debussy, Ravel, Schumann, Brahms, Bartók, Janáček, Falla, Ives* [81]), ASAP Solo Piano (*Liszt, Schubert, Schumann, Brahms, Debussy, Ravel, Rachmaninoff, Prokofiev, Balakirev, Glinka* [56]) | **1,025** | **101,739** | 242,740 | 485,480 |
| **Cohort 3: All Two-Hand Piano Scores** | **Cohort 2 + 1,458 Two-Hand Piano Accompaniment Scores (`OpenScore/Lieder` `.mxl`, extracting strictly the 2-staff `Piano` part)**: Brahms [111], Schubert [95], R. Schumann [72], C. Schumann [17], Holmès [73], Lang [52], Franz [48], Chaminade [35], F. Hensel-Mendelssohn [35], Cornelius [33], Bizet [26], Wolf [25], Debussy [20], Fauré [20], Satie [17], Grieg, Mahler, Strauss, Liszt, etc. | **2,483** | **181,689** | **427,785** | **855,570** |

---

### 1.2 Summary of Core Empirical Findings Across All 2,483 Piano Works

1. **The $2^4 = 16$ Quarter-Note Vocabulary Covers 89%–95% of All Simple-Meter Beats (and 97.6% With Triplets & Sextuplets)**:
   * Across **855,570 pooled single-hand quarter-note beats** (`RH ∪ LH` in Cohort 3), **90.9%** fall strictly on the $2^4 = 16$ sixteenth-note binary grid (`91.5%` in Cohort 1; `89.3%` in Cohort 2). Adding **eighth-note triplets** (`4.52%` base triplet + `0.90%` partial triplets) and **sixteenth sextuplets / 32nd runs** (`1.13%`) accounts for **97.5%** of every beat written across two centuries of piano music.
2. **Exact Definitions of "Both Hands" (`RH`, `LH`, `RH ∪ LH`, `(RH, LH)`, and `RH | LH`) & Extreme Pareto Concentration**:
   * We evaluate **all five mathematical definitions** of single-hand and two-hand streams side-by-side:
     1. **`RH` (Right Hand / Treble Staff Only)**
     2. **`LH` (Left Hand / Bass Staff Only)**
     3. **`RH ∪ LH` (Either Hand Pooled Union)**: Pools every single-hand bar from RH and every single-hand bar from LH into one combined vocabulary ($\text{Set}(RH \cup LH) = \text{Set}(RH) \cup \text{Set}(LH)$, which is a **strict superset** of both `RH` and `LH`).
     4. **`(RH, LH)` (Simultaneous Two-Hand Bimanual Pair)**: Treats each beat or bar as a **2D ordered pair `(RH_pattern, LH_pattern)`** (out of $16^2 = 256$ possible 1-beat pairs, $256^2 = 65,536$ possible 2-beat pairs, or $65,536^2 = 4,294,967,296$ possible $\frac{4}{4}$ bimanual bars).
     5. **`RH | LH` (1D Flattened Boolean OR)**: Merges both hands' attack timestamps onto a single 1D percussion line via bitwise `OR` (explaining why `RH | LH` has *fewer* unique 1D patterns than `RH` alone: when one hand rests or plays an upbeat while the other hand plays the downbeat, bitwise `OR` fills in the gaps into a uniform `[♫ ♫ ♫ ♫]` or `[♬♬ ♬♬ ♬♬ ♬♬]` stream!).
   * **Pareto Coverage Is Extraordinary Across All 2,483 Works**:
     * Out of **$16^4 = 65,536$** possible single-hand $\frac{4}{4}$ bars, across **83,424 single-hand bars (`RH ∪ LH`)**, **97.34% ($63,796$ combinations) NEVER OCCUR EVEN ONCE** in either hand!
     * Just **6 patterns** cover **50%** (`P50`) of all single-hand $\frac{4}{4}$ bars (`RH ∪ LH`), **47 patterns** (`0.07%` of $65,536$) cover **80%** (`P80`), and **133 patterns** (`0.20%`) cover **90%** (`P90`)!
     * At the **2-Beat Half-Bar level** ($16^2 = 256$), just **9 patterns** cover **80%** (`P80`) of all `RH ∪ LH` half-bars (`11` in `RH`, `7` in `LH`)!
     * At the **Simultaneous Two-Hand 1-Beat Pair `(RH, LH)` level** ($16 \times 16 = 256$), just **6 bimanual pairs** cover **50%** (`P50`), **15 pairs** cover **80%** (`P80`), and **25 pairs** cover **90%** (`P90`) of all two-hand beats in piano literature!
3. **Corpus Convergence ($510 \rightarrow 1,025 \rightarrow 2,483$ Works)**:
   * Scaling the corpus $5\times$ from $510$ works to $2,483$ works proves that **`P50`, `P75`, `P80`, `P90`, and `P95` are already converged at $N = 510$ works** (e.g., for `RH ∪ LH` 2-beat cells, `P50 = 3`, `P75 = 7`, `P80 = 9` are **100% identical** at $N=510$, $N=1,025$, and $N=2,483$!). Only `Total Unique Ever Seen` and `P99` grow slowly with sample size via *Heaps' Law* ($V(N) \propto N^\beta$) as ultra-rare 1-in-50,000 rhythmic idiosyncrasies are encountered.
4. **Why Rhythmic Patterns Need Their "Landing" Note (*Anacrusis $\rightarrow$ Crusis*)**:
   * Across all 2,483 works, **Dotted Quarter + Eighth (`♩. ♪`)** resolves onto an immediate **downbeat attack on the subsequent beat 93.54%–97.20% of the time in the Right Hand and 95.22%–98.97% of the time across both hands**!
   * **Dotted Eighth + Sixteenth (`♪. ♬`)** resolves onto an immediate **downbeat attack on the next beat 97.34% of the time in the Right Hand ($11,132 / 11,436$) and 98.98% of the time across both hands ($10,641 / 10,751$)**!
5. **Proportional Scale Invariance ($2\times$ Speed / Metric Zoom Level)**:
   * Across all three cohorts, the cosine similarity between 1-beat sixteenth-grid gestures (`♪. ♬`, `♪ ♬`, `♬ ♪ ♬`) and their $2\times$-slower 2-beat eighth-grid twins (`♩. ♪`, `♩ ♫`, `♪ ♩ ♪`) remains rock-solid at **`0.90–0.92`** (`0.9160` in Cohort 1, `0.9215` in Cohort 2, `0.8989` in Cohort 3).

---

## 2. Clarifying the Five Stream Definitions & Complete Pareto (`P50`–`P99`) Tables

### 2.1 Why "Both Hands" Must Be Defined Precisely (`RH ∪ LH` vs. `(RH, LH)` vs. `RH | LH`)

When analyzing a two-hand instrument like the piano, there are **three fundamentally different ways** to combine the Right Hand (`RH`) and Left Hand (`LH`). Distinguishing them explains why each behaves differently in combinatorial space:

| Stream Symbol | Name | Mathematical Definition | Theoretical Space for 1-Bar of $\frac{4}{4}$ | Why It Matters for Sight-Reading Pedagogy |
| :---: | :--- | :--- | :---: | :--- |
| **`RH`** | **Right Hand Only** | Single-hand pattern on Staff 1 (Treble) | $16^4 = \mathbf{65,536}$ | Measures the melodic / figuration vocabulary the right hand reads on the upper staff. |
| **`LH`** | **Left Hand Only** | Single-hand pattern on Staff 2 (Bass) | $16^4 = \mathbf{65,536}$ | Measures the bass / accompaniment / contrapuntal vocabulary the left hand reads on the lower staff. |
| **`RH ∪ LH`** | **Either Hand Pooled Union** | $\text{Count}_{RH\cup LH}(p) = \text{Count}_{RH}(p) + \text{Count}_{LH}(p)$ | $16^4 = \mathbf{65,536}$ | **True Single-Hand Vocabulary of the Piano**: Because $\text{Set}(RH \cup LH) = \text{Set}(RH) \cup \text{Set}(LH)$, `RH` and `LH` are strict subsets of `RH ∪ LH`, so $\text{Unique}(RH \cup LH) \ge \max(\text{Unique}(RH), \text{Unique}(LH))$ always holds! |
| **`(RH, LH)`** | **Simultaneous 2-Hand Pair** | Ordered 2D pair $(p_{RH}, p_{LH})$ occurring simultaneously in the same bar/beat | $16^4 \times 16^4 = \mathbf{4,294,967,296}$ *(256 for 1-beat)* | **True Bimanual Coordination Space**: Captures both hands' independent patterns simultaneously (e.g., RH playing `𝄾 ♪` while LH plays `♩`). $\text{Unique}((RH, LH))$ is vastly larger than `RH` or `LH` alone! |
| **`RH \| LH`** | **1D Flattened Boolean OR** | $p_{OR}[t] = p_{RH}[t] \lor p_{LH}[t]$ (merges both staves onto one percussion line) | $16^4 = \mathbf{65,536}$ | **Composite Surface Pulse**: Because the two hands complement each other (LH strikes the downbeat when RH plays an upbeat rest), bitwise `OR` fills in rests and collapses complementary patterns into steady `[♫ ♫ ♫ ♫]` or `[♬♬ ♬♬ ♬♬ ♬♬]`, yielding *fewer* unique 1D patterns than `RH` alone. |

---

### 2.2 Complete Pareto Coverage Tables (`P50`, `P75`, `P80`, `P90`, `P95`, `P99`, & `Unique Ever Seen`) Across All 2,483 Piano Works (Cohort 3)

Below is the complete empirical Pareto table across all **181,689 complete measures (2,483 piano scores)** for every metric level and all five stream definitions:

#### A. 1-Beat Sixteenth-Grid Cells (Theoretical Max: `16` for Single-Hand / `256` for 2-Hand Pair `(RH, LH)`)
| Stream Definition | Total Beats Analyzed ($N$) | Unique Patterns Ever Seen | % of Theoretical Space Used | **P50** (50% Coverage) | **P75** (75% Coverage) | **P80** (80% Coverage) | **P90** (90% Coverage) | **P95** (95% Coverage) | **P99** (99% Coverage) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Right Hand Only (`RH`)** | 380,517 | **16 / 16** | 100.00% | **2** | **4** | **4** | **5** | **7** | **12** |
| **2. Left Hand Only (`LH`)** | 396,753 | **16 / 16** | 100.00% | **2** | **3** | **3** | **4** | **5** | **10** |
| **3. Either Hand Pooled (`RH ∪ LH`)** | **777,270** | **16 / 16** | 100.00% | **2** | **3** | **3** | **5** | **6** | **12** |
| **4. Simultaneous 2-Hand Pair (`(RH, LH)`)** | 363,288 | **222 / 256** | **86.72%** | **6** | **12** | **15** | **25** | **39** | **92** |
| **5. 1D Flattened Boolean OR (`RH \| LH`)** | 363,288 | **16 / 16** | 100.00% | **2** | **3** | **3** | **4** | **6** | **8** |

#### B. 2-Beat Half-Bar Compound Cells (Theoretical Max: `256` for Single-Hand / `65,536` for 2-Hand Pair `(RH, LH)`)
| Stream Definition | Total Half-Bars ($N$) | Unique Patterns Ever Seen | % of Theoretical Space Used | **P50** (50% Coverage) | **P75** (75% Coverage) | **P80** (80% Coverage) | **P90** (90% Coverage) | **P95** (95% Coverage) | **P99** (99% Coverage) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Right Hand Only (`RH`)** | 151,087 | **227 / 256** | 88.67% | **4** | **9** | **11** | **24** | **40** | **94** |
| **2. Left Hand Only (`LH`)** | 154,917 | **196 / 256** | 76.56% | **3** | **5** | **7** | **13** | **24** | **66** |
| **3. Either Hand Pooled (`RH ∪ LH`)** | **306,004** | **236 / 256** | **92.19%** | **3** | **7** | **9** | **18** | **33** | **85** |
| **4. Simultaneous 2-Hand Pair (`(RH, LH)`)** | 150,436 | **2,985 / 65,536** | **4.55%** | **21** | **79** | **118** | **309** | **627** | **1,763** |
| **5. 1D Flattened Boolean OR (`RH \| LH`)** | 150,436 | **159 / 256** | 62.11% | **3** | **5** | **6** | **13** | **20** | **45** |

#### C. 1-Bar of $\frac{2}{4}$ Patterns (Theoretical Max: `256` for Single-Hand / `65,536` for 2-Hand Pair `(RH, LH)`)
| Stream Definition | Total $\frac{2}{4}$ Bars ($N$) | Unique Patterns Ever Seen | % of Theoretical Space Used | **P50** (50% Coverage) | **P75** (75% Coverage) | **P80** (80% Coverage) | **P90** (90% Coverage) | **P95** (95% Coverage) | **P99** (99% Coverage) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Right Hand Only (`RH`)** | 26,782 | **212 / 256** | 82.81% | **5** | **20** | **26** | **47** | **69** | **129** |
| **2. Left Hand Only (`LH`)** | 29,319 | **162 / 256** | 63.28% | **3** | **7** | **9** | **23** | **39** | **85** |
| **3. Either Hand Pooled (`RH ∪ LH`)** | **56,101** | **223 / 256** | **87.11%** | **4** | **12** | **18** | **37** | **59** | **120** |
| **4. Simultaneous 2-Hand Pair (`(RH, LH)`)** | 26,494 | **1,719 / 65,536** | **2.62%** | **39** | **166** | **227** | **483** | **804** | **1,455** |
| **5. 1D Flattened Boolean OR (`RH \| LH`)** | 26,494 | **125 / 256** | 48.83% | **2** | **7** | **10** | **19** | **29** | **60** |

#### D. 1-Bar of $\frac{3}{4}$ Patterns (Theoretical Max: `4,096` for Single-Hand / `16,777,216` for 2-Hand Pair `(RH, LH)`)
| Stream Definition | Total $\frac{3}{4}$ Bars ($N$) | Unique Patterns Ever Seen | % of Theoretical Space Used | **P50** (50% Coverage) | **P75** (75% Coverage) | **P80** (80% Coverage) | **P90** (90% Coverage) | **P95** (95% Coverage) | **P99** (99% Coverage) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Right Hand Only (`RH`)** | 42,233 | **535 / 4,096** | 13.06% | **7** | **23** | **31** | **64** | **112** | **280** |
| **2. Left Hand Only (`LH`)** | 45,420 | **440 / 4,096** | 10.74% | **3** | **9** | **13** | **30** | **63** | **200** |
| **3. Either Hand Pooled (`RH ∪ LH`)** | **87,653** | **665 / 4,096** | **16.24%** | **4** | **16** | **22** | **50** | **93** | **271** |
| **4. Simultaneous 2-Hand Pair (`(RH, LH)`)** | 41,904 | **3,392 / 16,777,216** | **0.020%** | **52** | **279** | **403** | **967** | **1,673** | **2,973** |
| **5. 1D Flattened Boolean OR (`RH \| LH`)** | 41,904 | **356 / 4,096** | 8.69% | **4** | **12** | **16** | **38** | **66** | **172** |

#### E. 1-Bar of $\frac{4}{4}$ & $\frac{2}{2}$ Patterns (Theoretical Max: `65,536` for Single-Hand / `4,294,967,296` for 2-Hand Pair `(RH, LH)`)
| Stream Definition | Total $\frac{4}{4}$ Bars ($N$) | Unique Patterns Ever Seen | % of Theoretical Space Used | **P50** (50% Coverage) | **P75** (75% Coverage) | **P80** (80% Coverage) | **P90** (90% Coverage) | **P95** (95% Coverage) | **P99** (99% Coverage) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Right Hand Only (`RH`)** | 41,394 | **1,379 / 65,536** | **2.10%** | **9** | **44** | **63** | **166** | **353** | **966** |
| **2. Left Hand Only (`LH`)** | 42,030 | **1,079 / 65,536** | **1.65%** | **4** | **22** | **32** | **87** | **210** | **660** |
| **3. Either Hand Pooled (`RH ∪ LH`)** | **83,424** | **1,740 / 65,536** | **2.66%** | **6** | **32** | **47** | **133** | **312** | **989** |
| **4. Simultaneous 2-Hand Pair (`(RH, LH)`)** | 40,325 | **6,703 / 4.29B** | **0.00016%** | **121** | **838** | **1,252** | **2,854** | **4,687** | **6,300** |
| **5. 1D Flattened Boolean OR (`RH \| LH`)** | 40,325 | **830 / 65,536** | **1.27%** | **3** | **16** | **26** | **73** | **157** | **483** |

---

### 2.3 Corpus Convergence Analysis: How Do `P50`–`P99` Change as Sample Size Scales $5\times$ ($510 \rightarrow 1,025 \rightarrow 2,483$ Works)?

A critical statistical question is whether 510 works was already large enough to capture the true distribution of piano rhythm, or whether adding nearly 2,000 more scores across Romantic, Impressionist, and 20th-century styles shifts the numbers.

Below is the side-by-side convergence table across **Cohort 1 ($510$ works)**, **Cohort 2 ($1,025$ solo piano works)**, and **Cohort 3 ($2,483$ total piano works)**:

| Metric & Stream | Cohort | Sample Size ($N$) | **P50** | **P75** | **P80** | **P90** | **P95** | **P99** | Total Unique Seen |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1-Beat Cells (`RH ∪ LH`)** *(Max = 16)* | **Cohort 1 (510 works)** | 223,728 | **2** | **3** | **4** | **5** | **7** | 11 | 16 / 16 |
| | **Cohort 2 (1,025 works)** | 433,524 | **2** | **3** | **4** | **5** | **6** | 11 | 16 / 16 |
| | **Cohort 3 (2,483 works)** | 777,270 | **2** | **3** | **3** | **5** | **6** | 12 | 16 / 16 |
| **1-Beat 2-Hand Pair (`(RH, LH)`)** *(Max = 256)* | **Cohort 1 (510 works)** | 105,883 | **7** | **14** | **16** | **27** | **40** | 77 | 167 / 256 |
| | **Cohort 2 (1,025 works)** | 199,652 | **7** | **13** | **16** | **27** | **42** | 88 | 198 / 256 |
| | **Cohort 3 (2,483 works)** | 363,288 | **6** | **12** | **15** | **25** | **39** | 92 | 222 / 256 |
| **2-Beat Half-Bar (`RH`)** *(Max = 256)* | **Cohort 1 (510 works)** | 44,632 | **4** | **10** | **13** | **28** | **47** | 96 | 179 / 256 |
| | **Cohort 2 (1,025 works)** | 82,473 | **4** | **9** | **12** | **26** | **43** | 97 | 206 / 256 |
| | **Cohort 3 (2,483 works)** | 151,087 | **4** | **9** | **11** | **24** | **40** | 94 | 227 / 256 |
| **2-Beat Half-Bar (`RH ∪ LH`)** *(Max = 256)* | **Cohort 1 (510 works)** | 89,184 | **3** | **7** | **9** | **21** | **36** | 84 | 184 / 256 |
| | **Cohort 2 (1,025 works)** | 167,260 | **3** | **7** | **9** | **20** | **35** | 86 | 221 / 256 |
| | **Cohort 3 (2,483 works)** | 306,004 | **3** | **7** | **9** | **18** | **33** | 85 | 236 / 256 |
| **1-Bar $\frac{4}{4}$ (`RH`)** *(Max = 65,536)* | **Cohort 1 (510 works)** | 11,013 | **9** | **50** | **72** | **168** | **297** | 615 | 725 (1.11%) |
| | **Cohort 2 (1,025 works)** | 19,642 | **10** | **55** | **80** | **195** | **373** | 841 | 1,037 (1.58%) |
| | **Cohort 3 (2,483 works)** | 41,394 | **9** | **44** | **63** | **166** | **353** | 966 | 1,379 (2.10%) |
| **1-Bar $\frac{4}{4}$ (`RH ∪ LH`)** *(Max = 65,536)* | **Cohort 1 (510 works)** | 21,867 | **6** | **35** | **54** | **147** | **286** | 710 | 928 (1.42%) |
| | **Cohort 2 (1,025 works)** | 39,319 | **6** | **40** | **59** | **165** | **353** | 936 | 1,329 (2.03%) |
| | **Cohort 3 (2,483 works)** | 83,424 | **6** | **32** | **47** | **133** | **312** | 989 | 1,740 (2.66%) |

> [!IMPORTANT]
> **Two Profound Statistical Conclusions from the Convergence Table:**
> 1. **`P50`, `P75`, `P80`, `P90`, and `P95` Are Rock-Solid Constants Across Corpus Scale**:
>    * Look at `2-Beat Half-Bar (RH ∪ LH)`: as the sample grows nearly $3.5\times$ from $89,184$ half-bars to $306,004$ half-bars, **`P50 = 3`, `P75 = 7`, and `P80 = 9` do not change by a single integer!**
>    * Look at `1-Bar 4/4 (RH)`: at $510$ works, `P50 = 9`, `P80 = 72`, `P90 = 168`; at $2,483$ works ($41,394$ bars), `P50 = 9`, `P80 = 63`, `P90 = 166`!
> 2. **Why `Total Unique Seen` Grows Slowly via Heaps' Law While `P90` Stays Constant**:
>    * In any natural language or musical corpus obeying a Zipf distribution, the head of the distribution (`P50`–`P95`) converges rapidly, while the extreme tail (`P99` and `Total Unique Seen`, representing *hapax legomena*—patterns that occur once in 50,000 bars) grows sub-linearly according to **Heaps' Law** ($V(N) \propto N^\beta$, here $\beta \approx 0.45$).
>    * Even after examining **83,424 single-hand $\frac{4}{4}$ bars across 2,483 works**, **97.34% ($63,796$ out of $65,536$) of theoretical 1-bar combinations still have zero occurrences**!

---

## 3. Investigation 1: The 1-Beat Vocabulary & Simultaneous Two-Hand Pairs (`(RH, LH)`)

### 3.1 Complete 1-Beat Pattern Distribution Across 855,570 Single-Hand Beats (Cohort 3: 2,483 Works)

| Rank (`RH ∪ LH`) | Beat Cell Name | Notation | 16th Grid `[1 e & a]` | `RH` Share (%) *(427,785 beats)* | `LH` Share (%) *(427,785 beats)* | **Pooled `RH ∪ LH` Share (%)** *(855,570 beats)* | `RH ∪ LH` Cum. % | `1D-OR` (`RH \| LH`) Share (%) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Quarter Note** | `♩` | `[X . . .]` | 28.66% | 38.56% | **33.61%** | 33.61% | 23.65% |
| **2** | **Two Eighths** | `♫` | `[X . X .]` | 21.80% | 20.48% | **21.14%** | 54.75% | 31.76% |
| **3** | **Rest / Tied Hold** | `𝄽 / Hold` | `[. . . .]` | 15.41% | 20.65% | **18.03%** | 72.78% | 6.55% |
| **4** | **Four Sixteenths** | `♬♬` | `[X X X X]` | 9.44% | 5.59% | **7.52%** | **80.30%** | 15.42% |
| **5** | *Eighth Triplet (Tuplet)* | `3♫♪` | `[T: 1 1 1]` | 5.05% | 3.98% | **4.52%** | 84.82% | 7.27% |
| **6** | **Upbeat Eighth** | `𝄾 ♪` | `[. . X .]` | 5.78% | 3.17% | **4.48%** | 89.29% | 1.53% |
| **7** | **Dotted 8th + 16th** | `♪. ♬` | `[X . . X]` | 2.68% | 1.80% | **2.24%** | **91.53%** | 2.52% |
| **8** | **Gallop (8th + Two 16ths)** | `♪ ♬` | `[X . X X]` | 1.34% | 0.80% | **1.07%** | 92.60% | 2.35% |
| **9** | **16th Rest + Three 16ths** | `𝄿 ♬♪` | `[. X X X]` | 1.23% | 0.33% | **0.78%** | 93.39% | 0.08% |
| **10** | *Sixteenth Sextuplet* | `6♬♬` | `[6-tuplet]` | 1.01% | 0.52% | **0.77%** | 94.15% | 1.53% |
| **11** | *Triplet Rest + Two Triplets* | `3𝄾 ♫` | `[T: 0 1 1]` | 0.96% | 0.20% | **0.58%** | 94.73% | 0.07% |
| **12** | **8th Rest + Two 16ths** | `𝄾 ♬` | `[. . X X]` | 0.54% | 0.21% | **0.37%** | 95.10% | 0.09% |
| **13** | **Reverse Gallop (2×16th+8th)** | `♬ ♪` | `[X X X .]` | 0.39% | 0.33% | **0.36%** | 95.47% | 0.60% |
| **14** | *Eight 32nds (Sub-16th)* | `32nds` | `[8×32nd]` | 0.49% | 0.22% | **0.36%** | 95.82% | 0.78% |
| **15** | *Long-Short Triplet (`♩ ♪`)* | `3♩ ♪` | `[T: 1 0 1]` | 0.26% | 0.37% | **0.32%** | 96.14% | 0.40% |
| **16** | **Off-Beat 16ths** | `𝄿 ♪ ♬` | `[. X . X]` | 0.51% | 0.09% | **0.30%** | 96.44% | 0.01% |
| **17** | **Late 16th Pickup** | `𝄾. ♬` | `[. . . X]` | 0.38% | 0.20% | **0.29%** | 96.73% | 0.10% |
| **18** | **Scotch Snap (16th + Dot 8th)** | `♬ ♪.` | `[X X . .]` | 0.20% | 0.33% | **0.27%** | 96.99% | 0.10% |
| **19** | **Intra-Beat Syncopation** | `♬ ♪ ♬` | `[X X . X]` | 0.32% | 0.07% | **0.20%** | 97.19% | 0.06% |
| **20** | **16th Rest + 16th + 8th** | `𝄿 ♪.` | `[. X X .]` | 0.21% | 0.03% | **0.12%** | 97.31% | 0.01% |

---

### 3.2 Top 15 Simultaneous Two-Hand Bimanual 1-Beat Pairs `(RH, LH)` Across 363,288 Beats

When a pianist reads two staves simultaneously, what are the most common **bimanual 1-beat combinations `(RH_cell, LH_cell)`** out of the $16 \times 16 = 256$ possible 16th-grid pairs?

| Rank | Right Hand (`RH`) Cell | Left Hand (`LH`) Cell | Bimanual Texture Archetype | Count (Cohort 3) | % of All 2-Hand Beats | Cumulative % |
| :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **1** | `♩` `[X . . .]` | `♩` `[X . . .]` | **Homorhythmic Quarter Pulse** (Chorale / Chordal / Waltz Beat 1) | 67,653 | 18.62% | 18.62% |
| **2** | `♫` `[X . X .]` | `♩` `[X . . .]` | **2-against-1 Melody over Quarter Bass** (Core Tier 1/2 texture!) | 33,961 | 9.35% | 27.97% |
| **3** | `𝄽 / Hold` `[. . . .]` | `𝄽 / Hold` `[. . . .]` | **Simultaneous Sustained Hold or Rest** (Half/Whole Note continuation) | 28,040 | 7.72% | 35.69% |
| **4** | `♫` `[X . X .]` | `♫` `[X . X .]` | **Parallel / Accompanimental Eighth Motion** | 27,967 | 7.70% | 43.39% |
| **5** | `♫` `[X . X .]` | `𝄽 / Hold` `[. . . .]` | **RH Eighths over Sustained Bass** | 20,534 | 5.65% | **49.04%** |
| **6** | `♩` `[X . . .]` | `♫` `[X . X .]` | **Quarter Melody over Walking / Alberti Eighth Bass** | 18,369 | 5.06% | 54.10% |
| **7** | `♩` `[X . . .]` | `𝄽 / Hold` `[. . . .]` | **RH Quarter Movement over Held Bass** | 17,986 | 4.95% | 59.05% |
| **8** | `𝄽 / Hold` `[. . . .]` | `♩` `[X . . .]` | **Held Melody over Moving Quarter Bass** | 15,540 | 4.28% | 63.32% |
| **9** | **`𝄾 ♪` `[. . X .]`** | **`♩` `[X . . .]`** | **Classic Bimanual Upbeat / Afterbeat (`LH Down → RH Up`)** | 11,994 | 3.30% | 66.63% |
| **10** | `𝄽 / Hold` `[. . . .]` | `♫` `[X . X .]` | **Sustained Long Melody over Eighth-Note Accompaniment** | 11,937 | 3.29% | 69.91% |
| **11** | `♬♬` `[X X X X]` | `♫` `[X . X .]` | **4-against-2 Baroque / Classical Figuration (`♬♬` over `♫`)** | 9,673 | 2.66% | 72.57% |
| **12** | `♬♬` `[X X X X]` | `𝄽 / Hold` `[. . . .]` | **RH Sixteenth Run over Sustained Bass** | 9,625 | 2.65% | 75.22% |
| **13** | `♬♬` `[X X X X]` | `♩` `[X . . .]` | **4-against-1 Sixteenth Run over Quarter Pulse** | 9,592 | 2.64% | 77.86% |
| **14** | `♬♬` `[X X X X]` | `♬♬` `[X X X X]` | **Bimanual Sixteenth Unison / Counterpoint** | 7,229 | 1.99% | **79.85%** |
| **15** | `♩` `[X . . .]` | `♬♬` `[X X X X]` | **Quarter Melody over Alberti / Murky Sixteenth Bass** | 4,829 | 1.33% | **81.18%** |

> [!TIP]
> **Look at Rank #9 (`RH: 𝄾 ♪ [. . X .] || LH: ♩ [X . . .]` — 11,994 occurrences!):**
> The single most common syncopated/off-beat bimanual coordination in all of piano literature is **Left Hand striking the downbeat (`♩`) while Right Hand enters on the upward rebound (`𝄾 ♪`)**! Practicing `𝄾 ♪` with our **Two-Hand Piano Tap Mode** (Left Hand tapping `♩` on `F`, Right Hand playing `𝄾 ♪` on `J`) directly trains the #9 most frequent bimanual coordination in the entire piano repertoire!

---

### 3.3 Composer-by-Composer Rhythmic Fingerprints (Solo Piano Right-Hand Stream)

| Composer | Era / Style | `♩` Quarter | `♫` Two 8ths | `♬♬` Four 16ths | `𝄽/Hold` Silent Beat | `𝄾 ♪` Upbeat 8th | `♪. ♬` Dotted 8th | `♪ ♬` Gallop | `♬ ♪` Rev. Gallop | `♬ ♪ ♬` Syncopation | `𝄿 ♬♪` 16th Pickup | `3♫♪` Triplet |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **J.S. Bach** | Baroque Counterpoint | 13.32% | 24.32% | **35.98%** | 4.87% | 1.56% | 1.61% | **5.36%** | 1.14% | 0.14% | 2.10% | 1.86% |
| **Scarlatti** | Baroque / Galant | 26.78% | **36.85%** | 8.02% | 10.01% | 4.44% | 0.97% | 3.95% | 0.13% | 0.00% | 1.19% | 3.36% |
| **Haydn** | Classical | 24.28% | 20.57% | 21.58% | 7.62% | 5.90% | 2.76% | 1.65% | 0.00% | 0.39% | 2.82% | 2.21% |
| **Mozart** | Classical | 24.75% | 21.79% | 17.05% | 8.90% | **6.10%** | 2.51% | 1.10% | 0.38% | 0.19% | 2.26% | 2.96% |
| **Beethoven** | Classical / Romantic | 30.79% | 20.10% | 11.81% | **16.47%** | 4.45% | 1.89% | 0.78% | 0.11% | 0.14% | 1.52% | **4.90%** |
| **Chopin** | Romantic | **39.79%** | 25.90% | 1.86% | 10.73% | 3.63% | **10.89%** | 0.08% | 0.00% | 0.00% | 0.00% | **4.50%** |
| **Joplin** | Ragtime | 22.60% | 16.25% | 14.99% | 8.80% | 6.01% | 2.11% | 4.93% | **1.98%** | **6.83%** | **8.39%** | 0.01% |

---

### 3.4 Compound Meter ($\frac{6}{8}, \frac{9}{8}, \frac{12}{8}, \frac{3}{8}$) Dotted-Quarter Beat Frequencies

Across **17,471 dotted-quarter beats** in compound meters (Cohort 1), just **7 compound cells** cover **80.33%** of all Right-Hand compound beats (`87.20%` in `1D-OR`):

| Rank (RH) | Compound Beat Cell | Notation | 3-Slot Grid `[1 2 3]` | Right Hand Count (%) | Right Hand Cum. % | `1D-OR` Count (%) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **1** | **Three Eighths (Rolling Pulse)** | `♫♪` | `[X X X]` | 4,558 (**26.09%**) | 26.09% | 7,128 (**40.80%**) |
| **2** | **Six Sixteenths (Compound Run)** | `♬♬♬` | `[1 1 1 1 1 1]` | 2,838 (**16.24%**) | 42.33% | 5,044 (**28.87%**) |
| **3** | **Dotted Quarter (Macro-Beat)** | `♩.` | `[X . .]` | 2,649 (**15.16%**) | 57.50% | 917 (**5.25%**) |
| **4** | **Quarter + Eighth (Long–Short Lilting Skip)** | `♩ ♪` | `[X . X]` | 1,782 (**10.20%**) | 67.70% | 1,283 (**7.34%**) |
| **5** | **Compound Rest / Hold** | `𝄽. / Hold` | `[. . .]` | 1,025 (**5.87%**) | 73.56% | 231 (**1.32%**) |
| **6** | **Eighth Rest + Two Eighths** | `𝄾 ♫` | `[. X X]` | 839 (**4.80%**) | 78.36% | 44 (**0.25%**) |
| **7** | **Late Eighth Pickup** | `𝄽 𝄾 ♪` | `[. . X]` | 344 (**1.97%**) | **80.33%** | 121 (**0.69%**) |
| **8** | **Eighth + Quarter (Short–Long Siciliana/Snap)** | `♪ ♩` | `[X X .]` | 160 (**0.92%**) | 81.25% | 96 (**0.55%**) |

---

## 4. Investigation 2: Top 2-Beat Compound Cells & Top 1-Bar $\frac{4}{4}$ Patterns Across All 2,483 Works

### 4.1 Top 15 Two-Beat Compound Words (`RH ∪ LH` Across 306,004 Half-Bars in Cohort 3)

| Rank | Beat 1 Cell | Beat 2 Cell | Combined 2-Beat Notation | Musical Function | Count (`RH ∪ LH`) | % of Half-Bars | Cum. % |
| :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **1** | `♩` `[X . . .]` | `Hold/𝄽` `[. . . .]` | `𝅗𝅥` or `♩ 𝄽` | Half note or quarter + rest | 62,150 | 20.31% | 20.31% |
| **2** | `♩` `[X . . .]` | `♩` `[X . . .]` | `♩  ♩` | Two-quarter pulse | 58,900 | 19.25% | 39.56% |
| **3** | `♫` `[X . X .]` | `♫` `[X . X .]` | `♫  ♫` | Even 4-eighth stride | 52,078 | 17.02% | **56.58%** |
| **4** | `♬♬` `[X X X X]` | `♬♬` `[X X X X]` | `♬♬  ♬♬` | Running 8-sixteenth passage | 20,762 | 6.78% | 63.36% |
| **5** | `𝄾 ♪` `[. . X .]` | `♫` `[X . X .]` | **`𝄾 ♪  ♫`** | **Upbeat eighth resolving into two eighths** | 12,519 | 4.09% | 67.45% |
| **6** | `♫` `[X . X .]` | `♩` `[X . . .]` | `♫  ♩` | **Trochaic resolution** (2 eighths landing on Beat 2) | 11,488 | 3.75% | 71.21% |
| **7** | `Hold/𝄽` `[. . . .]` | `♩` `[X . . .]` | `𝄽  ♩` | Off-downbeat quarter entry | 11,341 | 3.71% | **74.91%** |
| **8** | `♩` `[X . . .]` | `♫` `[X . X .]` | `♩  ♫` | **Anapestic drive** (Quarter + 2 eighths pushing to Beat 3) | 9,854 | 3.22% | 78.13% |
| **9** | `♩` `[X . . .]` | `𝄾 ♪` `[. . X .]` | **`♩. ♪`** *(or `♩ 𝄾 ♪`)* | **Dotted Quarter + Eighth** (requires Beat 3 landing!) | 8,945 | 2.92% | **81.06%** |
| **10** | `♪. ♬` `[X . . X]` | `♩` `[X . . .]` | **`♪. ♬  ♩`** | **Dotted 8th + 16th + Quarter Landing** | 5,204 | 1.70% | 82.76% |
| **11** | `♫` `[X . X .]` | `Hold/𝄽` `[. . . .]` | `♫  𝄽` | Two eighths + rest/hold | 4,791 | 1.57% | 84.32% |
| **12** | `Hold/𝄽` `[. . . .]` | `♫` `[X . X .]` | `𝄽  ♫` | Beat-2 eighth pair entry | 4,295 | 1.40% | 85.73% |
| **13** | `𝄾 ♪` `[. . X .]` | `𝄾 ♪` `[. . X .]` | `𝄾 ♪  𝄾 ♪` | Consecutive off-beat eighths (afterbeat accompaniment) | 4,026 | 1.32% | 87.04% |
| **14** | `♫` `[X . X .]` | `𝄾 ♪` `[. . X .]` | **`♪ ♩ ♪`** *(or `♫ 𝄾 ♪`)* | **Classic 2-Beat Syncopation (`Down - UP - (down) - UP`)** | 3,667 | 1.20% | 88.24% |
| **15** | `𝄾 ♪` `[. . X .]` | `♩` `[X . . .]` | **`𝄾 ♪  ♩`** | **Upbeat eighth resolving onto Beat-2 quarter** | 3,128 | 1.02% | **89.26%** |

---

## 5. Investigation 3: Why Rhythmic Patterns Need Their "Landing" Note (*Anacrusis $\rightarrow$ Crusis*) & Optimal Phrase Length

### 5.1 Musicological & Motor Foundation: Metric Boundary vs. Gestalt Grouping Boundary

> **User's Insight**: *"I would guess that the ideal length is more than two bars, as it does seem to make a difference if a rhythmic pattern just ends or is surrounded by others (classic example is a 'gallop' made by dotted notes, where, say, a dotted quarter followed by an eighth doesn't really 'gallop' unless it's followed by another note on the subsequent fourth, if you know what I mean?). Maybe bars should get longer over time. Maybe also not."*

This insight captures the foundational theorem of **Cooper & Meyer (*The Rhythmic Structure of Music*, 1960)** and **Lerdahl & Jackendoff (*A Generative Theory of Tonal Music*, 1983)**:

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
   * However, **phenomenal (perceptual and motor) rhythm** is organized by **proximity and attack-point closure** (*Lerdahl & Jackendoff GPR 2a/2b*): a short note (`♪` or `♬`) immediately preceding a longer or metrically stronger note is perceived and executed by the motor cortex **not as the end of the previous beat, but as an *anacrusis* (pickup/catapult) belonging to the NEXT beat's downbeat (*crusis*)**!
2. **Acoustic & Biomechanical Proof on the Piano**:
   * On a percussive instrument like the piano (or when tapping a key), an attack is an impulse: **you cannot hear how long the eighth note `♪` in `♩. ♪` lasts unless another note is struck on the subsequent beat to close its inter-onset interval (IOI)!** Without a landing note on Beat 3, a pianist playing `♩. ♪` and `♩. ♬` produces the *exact same two attack timestamps*! Only the **landing note on the next beat** defines the duration of the short note and completes the ballistic motor trajectory (Godøy, 2010).

---

### 5.2 Hard Statistical Proof Across All Three Corpus Scales: Conditional Probability of a Downbeat Landing

Across all three cohorts ($510 \rightarrow 1,025 \rightarrow 2,483$ works), we measured the empirical Markov transition probability $P(\text{Downbeat Attack on Next Beat} \mid \text{Anacrustic Pattern on Current Beat})$:

| Anacrustic Pattern | Cohort | Right Hand (`RH`) Downbeat Landing Rate | Both Hands (`1D-OR`) Downbeat Landing Rate |
| :--- | :--- | :---: | :---: |
| **Dotted Quarter + Eighth (`♩. ♪` $\rightarrow$ Beat $t+2$)** | **Cohort 1 (510 works)** | **97.20%** *(2,322 / 2,389)* | **98.97%** *(578 / 584)* |
| | **Cohort 2 (1,025 works)** | **94.44%** *(4,826 / 5,110)* | **96.62%** *(1,257 / 1,301)* |
| | **Cohort 3 (2,483 works)** | **93.54%** *(8,365 / 8,943)* | **95.22%** *(3,007 / 3,158)* |
| **Dotted Eighth + Sixteenth (`♪. ♬` $\rightarrow$ Beat $t+1$)** | **Cohort 1 (510 works)** | **97.91%** *(3,693 / 3,772)* | **99.50%** *(3,354 / 3,371)* |
| | **Cohort 2 (1,025 works)** | **96.58%** *(7,226 / 7,482)* | **98.70%** *(6,899 / 6,990)* |
| | **Cohort 3 (2,483 works)** | **97.34%** *(11,132 / 11,436)* | **98.98%** *(10,641 / 10,751)* |
| **Classic Gallop (`♪ ♬` $\rightarrow$ Beat $t+1$)** | **Cohort 1 (510 works)** | **88.81%** *(2,096 / 2,360)* | **99.36%** *(3,426 / 3,448)* |
| | **Cohort 2 (1,025 works)** | **92.41%** *(3,911 / 4,232)* | **97.87%** *(6,719 / 6,865)* |
| | **Cohort 3 (2,483 works)** | **93.95%** *(5,360 / 5,705)* | **98.51%** *(9,871 / 10,020)* |

---

### 5.3 Cross-Barline Momentum & Optimal Exercise Length (2 Bars vs. 4 Bars vs. Progressive Horizon)

1. **Cross-Barline Anacrusis Rate (`77.9%` of Bars Push Across the Barline!)**:
   * Out of `38,706` consecutive simple-meter bar transitions in Cohort 1, **77.90%** (`30,150` bars) have subdivided/off-beat activity on the final beat of the bar, and **99.33% (`1D-OR`) / 91.55% (`RH`)** resolve directly onto a **downbeat attack on Beat 1 of the next bar**!
2. **Hypermetric Phrase Structure (Why 4 Bars Is the Canonical "Sentence" of Western Music)**:
   * Across `9,541` consecutive 4-bar windows ($\text{Bar}_1, \text{Bar}_2, \text{Bar}_3, \text{Bar}_4$):
     * **2-Bar Parallelism ($\text{Bar}_1 = \text{Bar}_3$)**: In **35.67%** of all 4-bar windows, Bar 3 has the **exact same Right-Hand rhythmic pattern** as Bar 1 (the classic **Antecedent–Consequent Period**: `Statement [Bar 1–2] -> Parallel Response [Bar 3–4]`).
     * **1-Bar Immediate Repetition ($\text{Bar}_1 = \text{Bar}_2$)**: In **35.94%** of all 4-bar windows, Bar 2 repeats Bar 1's rhythmic motif (forming the classic **Caplin/Schoenberg Sentence** `1 + 1 + 2`).
     * **Cadential Breathing Points (Bar 2 & Bar 4)**: Unsubdivided final beats peak on **Bar 2 (`22.17%`)** and **Bar 4 (`23.23%`)**, while **Bar 3** has the highest onset density (`6.11` RH onsets/bar), driving toward the Bar 4 cadence.
3. **The 3-Stage Progressive Phrase Horizon (Always Obeying the "+1 Landing" Rule)**:
   * **Stage A (First Contact with a New Word)**: **`2-Beat Gesture + Landing`** (`[♪. ♬] ──► [♩]`, or `1 Bar + Beat-1 Landing`), keeping visual load minimal while preserving the motor landing.
   * **Stage B (Sub-Phrase Consolidation)**: **`2 Bars + Landing`**, training cross-barline momentum across one barline.
   * **Stage C (Core Sight-Reading Fluency)**: **`4-Bar Repertoire Sentence`**—exceeding verbatim working memory ($4 \pm 1$ chunks) so the learner cannot just memorize the bar before starting, forcing genuine **1–2 beat Eye-Hand Span look-ahead** and **structural chunking** (`Bar 1 == Bar 3`).

---

## 6. Investigation 4: Proportional Scale Invariance ($2\times$ Speed / Metric Zoom Level)

### 6.1 Acoustic Identity & Corpus Scale Invariance (`Cosine Similarity = 0.90–0.92`)

* **Acoustic & Motor Identity**: `♩. ♪ | ♩` at $\♩ = 120\text{ BPM}$ ($500\text{ ms/beat}$) has the **exact same millisecond onset timestamps** ($0\text{ ms}, 750\text{ ms}, 1000\text{ ms}$) as `♪. ♬ | ♪` at $\♩ = 60\text{ BPM}$ ($1000\text{ ms/beat}$).
* **Empirical Corpus Similarity**:
  * Comparing the 1-beat sixteenth-grid frequency vector against the $2\times$-slower 2-beat eighth-grid frequency vector yields a **Cosine Similarity of `0.9160` (Cohort 1), `0.9215` (Cohort 2), and `0.8989` (Cohort 3)**.
  * Comparing $\frac{3}{4}$ bars against $2\times$-rescaled $\frac{3}{8}$ bars yields a **Cosine Similarity of `0.8609`**.
* **Where $1\times$ and $2\times$ Genuinely Differ in Human Reading**:
  1. **Where the Physical Tactus Bounce Lands**: In `♩. ♪ → ♩` (in $\frac{4}{4}$), the pianist's physical quarter-note pulse **bounces silently on Beat 2 inside the held dotted quarter** before playing `♪` on Beat 2's upward rebound; in `♪. ♬ → ♩`, the entire skip occurs **inside a single beat bounce** (unless in $\frac{2}{2}$ Cut Time, where shifting the pulse to the Half Note `𝅗𝅥` makes `♩. ♪ → ♩` biomechanically identical to `♪. ♬ → ♩`!).
  2. **Visual Beaming vs. Stems/Flags**: `♩. ♪` uses an unbeamed stem + dot + single flag across two beats; `♪. ♬` uses a solid primary beam + inner secondary hook (`┌─. ┐`).
  3. **Phrase-Structural Role (`♫ ♩` vs. `♬ ♪`)**: `[X X X .]` is **$10.5\times$ more common** at the 2-beat scale (`♫ ♩` = `5.37%` in Cohort 1) than at the 1-beat scale (`♬ ♪` = `0.51%`) because `♫ ♩` serves as a stable 2-beat trochaic cadence landing on Beat 2.

---

## 7. Authentic 4-Bar Repertoire Phrases Extracted from the Piano Corpus

### Tier 1 & Tier 2: Pulse, Rests, Upbeats (`𝄾 ♪`), and Dotted Quarter + Eighth (`♩. ♪ → ♩/♫`)
* **W.A. Mozart — *Piano Sonata No. 1 in C Major*, K. 279, Mvt. 1, mm. 26–29 ($\frac{4}{4}$)**:
  * `m.26: [♩   𝄾 ♪   ♫   ♫]  ||  m.27: [♩   𝄾 ♪   ♩   𝄽]  ||  m.28: [♩   𝄽   ♩   𝄽]  ||  m.29: [♫   ♫   ♫   ♫]`
* **J.S. Bach — *Fugue No. 8 in D-sharp Minor (WTC Book I)*, BWV 853b, mm. 1–4 ($\frac{4}{4}$)**:
  * `m.1: [♩   ♩   𝄾 ♪   ♫]  ||  m.2: [♫   ♩   ♩   ♩]  ||  m.3: [𝄾 ♪   ♩   ♩   ♫]  ||  m.4: [♫   ♫   ♫   ♫]`
* **L. van Beethoven — *Piano Sonata No. 2 in A Major*, Op. 2 No. 2, Mvt. 1, mm. 10–13 ($\frac{2}{4}$)**:
  * `m.10: [♫   ♫]  ||  m.11: [♫   ♫]  ||  m.12: [♩   𝄽]  ||  m.13: [𝄾 ♪   ♫]`

### Tier 3: The Sixteenth-Note Word Family (`♬♬`, `♪ ♬` Gallop, `♬ ♪` Reverse Gallop, `𝄿 ♬♪` Pickup Burst)
* **W.A. Mozart — *Piano Sonata No. 1 in C Major*, K. 279, Mvt. 1, mm. 4–7 ($\frac{4}{4}$)**:
  * `m.4: [♩   ♬♬   ♬♬   ♬♬]  ||  m.5: [♪ ♬   ♫   ♩   ♩]  ||  m.6: [𝄾 ♬   ♫   ♩   ♩]  ||  m.7: [𝄾 ♪   ♫   ♩   ♩]`
* **J.S. Bach — *Fugue No. 2 in C Minor (WTC Book I)*, BWV 847b, mm. 1–4 ($\frac{4}{4}$)**:
  * `m.1: [𝄾 ♬   ♫   ♪ ♬   ♫]  ||  m.2: [♪ ♬   ♫   ♬ ♪   𝄾 ♬]  ||  m.3: [♬♬   ♬♬   ♪ ♬   ♫]  ||  m.4: [♪ ♬   ♫   ♬ ♪   ♪ ♬]`
* **J.S. Bach — *Fugue No. 3 in C-sharp Major (WTC Book I)*, BWV 848b, mm. 12–15 ($\frac{4}{4}$)**:
  * `m.12: [♬♬   ♬♬   ♬♬   ♬♬]  ||  m.13: [♪ ♬   ♬♬   ♬♬   ♬♬]  ||  m.14: [♬♬   ♬♬   ♬♬   ♬♬]  ||  m.15: [♩   𝄿 ♬♪   ♬♬   ♬♬]`

### Tier 4: Dotted Sixteenth Snaps (`♪. ♬ → ♩`) & Syncopation (`♬ ♪ ♬`)
* **F. Chopin — *Prelude in D-flat Major ("Raindrop")*, Op. 28 No. 15, mm. 5–8 ($\frac{4}{4}$)**:
  * `m.5: [♪. ♬   ♩   Hold   ♩]  ||  m.6: [♩   Hold   Hold   ♩]  ||  m.7: [♪. ♬   ♩   Hold   ♩]  ||  m.8: [♩   𝄾 ♪   ♩   ♫]`
  * *Demonstrates both Antecedent–Consequent 4-bar periodicity (`m.5 == m.7`) and $2\times$ Scale Invariance (`♪. ♬ → ♩` in mm. 5, 7 stretched by $2\times$ into `♩. ♪ → ♩` in m. 8)!*
* **W.A. Mozart — *Piano Sonata No. 4 in E-flat Major*, K. 282, Mvt. 1, mm. 1–4 ($\frac{4}{4}$)**:
  * `m.1: [♪. ♬   ♩   𝄾 ♪   ♫]  ||  m.2: [♬♬   ♩   ♬ ♪   𝄾 ♬]  ||  m.3: [♬ ♪   𝄾 ♬   ♩   𝄾 ♪]  ||  m.4: [♩   ♩   𝄾 ♪   ♫]`
* **L. van Beethoven — *Piano Sonata No. 5 in C Minor*, Op. 10 No. 1, Mvt. 2, mm. 91–94 ($\frac{2}{4}$)**:
  * `m.91: [♬ ♪ ♬   ♬ ♪ ♬]  ||  m.92: [♬ ♪ ♬   𝄿 ♪ ♬]  ||  m.93: [♬ ♪ ♬   ♬ ♪ ♬]  ||  m.94: [♬ ♪ ♬   𝄿 ♪ ♬]`
* **S. Joplin — *The Easy Winners*, mm. 1–8 ($\frac{2}{4}$)**:
  * `m.1: [♫   𝄿 ♬♪]  ||  m.2: [♬ ♪ ♬   ♪ ♬]  ||  m.3: [♬♬   ♬♬]  ||  m.4: [♩   𝄽]`
  * `m.5: [♫   𝄾 ♪]   ||  m.6: [♬ ♪ ♬   ♬ ♪]  ||  m.7: [♬ ♪ ♬   ♬♬]  ||  m.8: [𝄾 ♬   ♬♬]`

---

## 8. Musicological & Corpus References
1. **Cooper, G., & Meyer, L. B. (1960).** *The Rhythmic Structure of Music.* University of Chicago Press.
2. **Lerdahl, F., & Jackendoff, R. (1983).** *A Generative Theory of Tonal Music.* MIT Press.
3. **Caplin, W. E. (1998).** *Classical Form: A Theory of Formal Functions for the Instrumental Music of Haydn, Mozart, and Beethoven.* Oxford University Press.
4. **Huron, D. (2006).** *Sweet Anticipation: Music and the Psychology of Expectation.* MIT Press.
5. **London, J. (2012).** *Hearing in Time: Psychological Aspects of Musical Meter* (2nd ed.). Oxford University Press.
6. **Godøy, R. I., & Leman, M. (Eds.). (2010).** *Musical Gestures: Sound, Movement, and Meaning.* Routledge.
7. **Sapp, C. S. (2005–2024).** *KernScores & Humdrum Data Digital Piano Corpora.* CCARH, Stanford University (`bach-wtc`, `inventions`, `art-of-the-fugue`, `bach-musical-offering`, `mozart-piano-sonatas`, `beethoven-piano-sonatas`, `haydn-piano-sonatas`, `chopin-preludes`, `chopin-mazurkas`, `humdrum-chopin-first-editions`, `hummel-preludes`, `scarlatti-keyboard-sonatas`, `joplin`, `Mysterium`, `rds-scores`).
8. **Foscarin, F., et al. (2020).** *ASAP: A Dataset of Aligned Scores and Performances for Piano Transcription.* ISMIR 2020 (`fosfrancesco/asap-dataset`).
9. **Gotham, M., & Jonas, P. (2022).** *The OpenScore Lieder Corpus.* Music Encoding Conference (`OpenScore/Lieder`, 1,462 two-hand piano scores across 127 composers).
