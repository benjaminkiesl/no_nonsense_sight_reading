# High-Level Specification for No-Nonsense Sight-Reading

The high-level idea behind this app is to apply the principles of Deliberate Practice (as described, for example, in a popular fashion in the book "Peak") to sight-reading on the piano.

We want to practice hitting notes on the staff (both treble and bass clef) as the main goal. To achieve this, users can connect their MIDI keyboard to the app (default mode) and use an on-screen keyboard (both by pressing the buttons there and by hitting their laptop/keyboard keys). Inititally this will start with single notes. Later on we then want to add intervals and also chords. The main idea here is that the user will see a grand staff and underneath it an on-screen piano showing the inner four octaves. On top of the page is just a simple header. 

## Principles of Deliberate Practice Applied

We want to make sure things start easy and then progress slowly to make things harder over time, thus keeping the users engaged while not overwhelming them. We want complexity right around the zone where a flow is hit and things are challenging but not hard (and not too easy either, though we might sometimes start on the easy end). Complexity will thus increase in such a way that users barely notice how they are actually getting better/faster at recognizing sheet music.

Failures will mean that the wrong things (the failures) will be exposed more often to the user so that they can focus on the things that challenge them most (instead of randomly practicing things).

## Main Idea behind Note Reading Path

The user will see the Grand staff and play through levels. Each level is built from a set of notes (initially just separate single notes, this is what we'll build at first, but we will later extend towards intervals, chords, etc.) that the user will have to learn to identify and press when they see it on the staff. All of this starts with three notes per staff, then extends by two notes per level.

The grand staff has a zone on the left (right of the keys) that is a broader "bar" like thing that is the "hit zone". That zone is maybe 30 pixels or so wide (depending on device) and notes that are in this zone can/must be pressed. 
A level for note reading works like this: The level is split into three phases: Learn, Speed Up, and Hold.

1. Learn: during that phase, the user is shown notes (quarter notes) statically inside the hit zone. They must then just press the note until the next one shows up. If they get it wrong, this is visually indicated but the note stays there until they get it right. This phase is meant to familiarize the user with new notes. Each new note (new to the level) must be hit correctly (at first attempt) at least 5 times. New notes from the previous two levels are also shown in between, but there it's okay if they are correct only once. Overall we want to avoid having more than 24 new notes in the Learn phase if possible.

In the Learn phase the actual thing happens: At the beginning, a counter counts down from 3 (one count per second) and after that, notes are coming in from the right at a certain speed (the first note will wait just a bit right of the hit zone), meaning that the user has only restricted time to hit a note (namely while it's in the hit zone). Notes can be pressed when they enter the zone from the right (and here we are graceful: they can already be pressed slightly before that, to avoid punishing/missing slightly early hits) and they must be pressed before they hit the left border of the zone. If they are not hit before that, the note will count as a miss, will be visually highighlighted as a failure, and remain there until the user gets it right (by pressing the right key). Notes that are correctly pressed will be visually highlighted as correct and will then fade out quickly. If the user presses a key when no note is in the zone, then the zone will just subtly visually indicate that a press was made, but nothing else happens. During the Learn Phase, the speed will gradually increase as long as correct notes are hit until a maximum speed. When the maximum speed is reached, the "Hold" stage is entered.

In the Hold stage, the user has to hit 32 correct notes at maximum speed (with no further speed up). Any failure will throw them back into the Speed Up phase. Only if they hit all correct notes will they finish the level, which will be met with a short visual celebration. They can then choose to continue to the next level by pressing any key.

## Failures

In general, we want that every failure (missed note) will slow down things by about 8% in general, meaning that the target speed will become slower (but not slower than the minimum of the level) and the progress inside the level is going backwards accordingly (but quick subsequent misses shouldn't slow the whole thing down too much, because that would frustrate users). That *general* slowdown is accompanied by the following: the movement will stop (with the failure note higlighted as failure visually) until the user presses the note correctly. After that, things will slow down considerably to a very slow speed before they accelerate up to the current target speed (i.e., previous target speed before failure - 8%) again within 4 seconds.

A failure will also mean that the wrong note will have a significantly higher probability of occurring subsequently.

## Speed Progression

The main progression is: very slow at the very beginning (~40 BPM), then speed up quickly (within 4 seconds) to initial target speed (60 BPM), then speed up to maximum target speed (~90 BPM) gradually.

The initial speed of a level will be very slow, but from then on it will speed up over the course of the level. After the initial very slow speed, it will quickly progress to a faster speed (but not too fast) and then gradually move up towards the maximum speed. When the maximum speed is reached, the user enters the "Hold" zone, at which point things will not speed up anymore but the user has to avoid ANY mistakes to reach the final goal. If they make a mistake, they are thrown back into the speed up zone again.

So, in short: slowdown after failure, then increasing as long as there are no failures. Failures leading to slowdown (a lot initially, but climbing back quickly to a new slightly lower target speed).

## Note distributions

We will pick a meaningful distribution that determines how likely a note is to show up. This will be close to a uniform distribution in general, but mistakes will pump the likelihood of a note showing up significantly. After such a pump, the things will, however, slowly go back to their 'mean' again. That way we make sure that mistakes are practiced a lot.

There will be a quesoitn of how we model mistakes in general: will we change the distribution AND statically queue in more of that note, or will we only handle this through the distribution and its modifications (which would be elegant if we have a good model for that).

Also, notes that are new in a level will have a significantly higher likelihood of showing up in that level (to practice them more, since they are new).

In case of failures, it will make sense to also change the distribution of the note before the failure, because that one might actually have caused the failure, even if it was correct, by slowing down the user and/or demanding more attention.

## Levels

Each clef will start with the three notes c,d,e (of the inner two octaves) and then add two notes per level, gradually expanding the intervals. For treble clef, it will just climb up until C6 (but it will also go down below middle C to the A) and for bass clef it will first go up, then grow downwards until C2.

Combined levels always combine the notes of the two clefs from the previous levels.

Once all intervals are full, we'll also add levels for different scales by adding #/b. We'll add levels based on how common the scales are (probably starting with G Major, A minor) and we will do research to figure out which ones are most common.

### Mapping of Keyboard Keys to Notes

The mapping will be as follows (we use the names of the keys for this): 

c->C, d->D, e->E, f->F, g->G, a->A, {h,b}->B (i.e., both h and b work as B, which is called h in German)

For # (like F#) we use Shift as the modifier. (i.e., Shift+f -> F#). For b we use Cmd on macOs and Alt on Windows/Linux (i.e., Cmd+d -> Db on macOS and Alt+d -> Db on Windows/Linux).

For the keyboard mode, the octave will adapt automatically to the current one whereas on the piano you have to hit the exact notes for each octave.

## Platforms

Initially this will be a web app, but further on we want to expand this into an Android/iOS app that can be used on tablets and phones. The choice of language, framework, etc. should keep that into account.

## Representation of Notes

We want a meaningful representation of notes in general, because ideally we will want to use the format later to read existing piano music and practice it with that thing.

## UI Design Principles

We want to keep the design warm, straight, and reduced following the main tenet "if in doubt, leave it out". Every UI item has to pass the "do we really need this?" test or else it will be removed. To appeal with musicians, we'll keep the font and the style classic, but not overly so. At some point we might even consider making things a little more fun (e.g., with animals or so, in a cartoonish design, but not yet).

In the initial version, we'll really just have the header (which contains the title "No-Nonsense Sight-Reading"), the grand staff, the progress inside the level, the on-screen piano, and in the header a small text (somewhere rather to the right) that says "*MIDI:* <device name>" (e.g., "*MIDI:* Yamaha NU1XA") or "*MIDI:* No device connected". Then on the right of that we have the "level graph" which shows you all the levels that are available, the current one, and the ones already finished successfully.

For the notes that move in from the right, the distance between any two notes should be around three centimeters. 

### Progress Bar for Progress Inside Level

For the progress bar inside the level, we imagine it to be as wide as the staff and the piano (they are all the same width ideally). And the bar will be filled with discrete "steps" next to each other as the speed is progressing. There should be some subtle but visible way to animate when the speed goes up. Left zone is "Learn", middle (largest) zone is "Speed Up", right most zone is "Hold". Mistakes lead to shrinking of the progress bar, of course, appropriate to the slowdown that happens through the mistake. However, only the "target speed" (the speed they should reach in general) is displayed in that bar, meaning that a short drastic slowdown after a mistake, for example, is not visualized by emptying the progress bar or so (that would be weird).

### Level Graph 

The level graph displays all the possible levels. In the initial version, we'll have three vertical lanes moving upwards as things progress. Each level will be depicted by a circle (around 60px radius) with its own icon. The icon should show the staff used and the interval covered by the level (intervals visualized by two quarter notes). If there are two staffs, then both will be in the icon. Directed edges/arrows will go from each level to the next one that depends on it.

On the left of that graph, we'll have lane for the treble clef, on the right bass clef, and in the middle "both". That means we have arrows always to the next level in the same clef, and then also arrows into the both one thta combines the previous one. Finally, also always an arrow from the "both" level to the next "both" level.

The current level is highlighted separately. When a level is finished successfully, all levels that have a path to that level in the graph will also be highlighted as finished (because the finished one is a superset of those).

### Color Scheme

Here's the color scheme we want to use (specified in CSS). Emerald going to be the main color for the header and in general.

```
/* CSS HEX */
--vibrant-coral: #ee6055ff;
--emerald: #60d394ff;
--light-green: #aaf683ff;
--jasmine: #ffd97dff;
--sweet-salmon: #ff9b85ff;

/* CSS HSL */
--vibrant-coral: hsla(4, 82%, 63%, 1);
--emerald: hsla(147, 57%, 60%, 1);
--light-green: hsla(100, 86%, 74%, 1);
--jasmine: hsla(42, 100%, 75%, 1);
--sweet-salmon: hsla(11, 100%, 76%, 1);

/* SCSS HEX */
$vibrant-coral: #ee6055ff;
$emerald: #60d394ff;
$light-green: #aaf683ff;
$jasmine: #ffd97dff;
$sweet-salmon: #ff9b85ff;

/* SCSS HSL */
$vibrant-coral: hsla(4, 82%, 63%, 1);
$emerald: hsla(147, 57%, 60%, 1);
$light-green: hsla(100, 86%, 74%, 1);
$jasmine: hsla(42, 100%, 75%, 1);
$sweet-salmon: hsla(11, 100%, 76%, 1);

/* SCSS RGB */
$vibrant-coral: rgba(238, 96, 85, 1);
$emerald: rgba(96, 211, 148, 1);
$light-green: rgba(170, 246, 131, 1);
$jasmine: rgba(255, 217, 125, 1);
$sweet-salmon: rgba(255, 155, 133, 1);

/* SCSS Gradient */
$gradient-top: linear-gradient(0deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-right: linear-gradient(90deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-bottom: linear-gradient(180deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-left: linear-gradient(270deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-top-right: linear-gradient(45deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-bottom-right: linear-gradient(135deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-top-left: linear-gradient(225deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-bottom-left: linear-gradient(315deg, #ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
$gradient-radial: radial-gradient(#ee6055ff, #60d394ff, #aaf683ff, #ffd97dff, #ff9b85ff);
```
