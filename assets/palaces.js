/* Story Palace — pre-built palaces.
   Each palace is a fixed, ordered sequence of numbered hooks wrapped in a
   story. A hook's `beat` is one story sentence with the hook word wrapped
   in <em>…</em>. Language is deliberately non-visual: sound, smell, taste,
   touch, temperature, motion, and cause-and-effect — never "picture this".
   Hook types: sound · smell (smell/taste) · touch (feel/temperature/emotion)
   · motion (do it with your body) · logic (this beat causes the next). */

"use strict";

const HOOK_TYPES = {
    sound: { glyph: "♪", label: "sound" },
    smell: { glyph: "❋", label: "smell/taste" },
    touch: { glyph: "✋", label: "touch/feel" },
    motion: { glyph: "↻", label: "action" },
    logic: { glyph: "➜", label: "cause" },
};

const PREBUILT_PALACES = [
    {
        id: "body",
        name: "The Body",
        tagline: "10 hooks · your own body, top to bottom",
        intro:
            "Your body is the one route you can never lose. This story walks " +
            "from your head down to your chest in ten stops. As you read each " +
            "beat, actually touch that body part — the physical action is the " +
            "anchor, no imagery required.",
        hooks: [
            { n: 1, label: "head", type: "touch", beat: "You wake and lift your <em>head</em> — press a palm flat on top of it and feel the warmth there." },
            { n: 2, label: "ear", type: "sound", beat: "A low hum reaches your <em>ear</em>; you tug the earlobe once to make sure you heard it." },
            { n: 3, label: "eyes", type: "motion", beat: "Your <em>eyes</em> blink against the morning; you rub them slowly with two knuckles." },
            { n: 4, label: "nose", type: "smell", beat: "You breathe in through your <em>nose</em> — coffee, somewhere, and warm bread." },
            { n: 5, label: "mouth", type: "smell", beat: "Your <em>mouth</em> still tastes of sleep; you run your tongue across your teeth." },
            { n: 6, label: "throat", type: "touch", beat: "You swallow, and your <em>throat</em> clicks — dry, asking for water." },
            { n: 7, label: "shoulder", type: "motion", beat: "You roll your right <em>shoulder</em> in a slow circle until it releases." },
            { n: 8, label: "elbow", type: "sound", beat: "Your <em>elbow</em> cracks quietly as you straighten the arm out." },
            { n: 9, label: "hands", type: "motion", beat: "You spread both <em>hands</em> wide, then squeeze them into fists, twice." },
            { n: 10, label: "chest", type: "touch", beat: "You finish with a palm on your <em>chest</em>, feeling the slow drum of your heartbeat." },
        ],
    },
    {
        id: "day",
        name: "The Day",
        tagline: "25 hooks · a morning-to-night routine you already know by heart",
        intro:
            "You have rehearsed this sequence thousands of times: an ordinary " +
            "day, from alarm to pillow. Because the order is already burned " +
            "in, each stop can carry one thing you want to remember.",
        hooks: [
            { n: 1, label: "alarm", type: "sound", beat: "The <em>alarm</em> rips through the quiet and your hand slaps it silent." },
            { n: 2, label: "stretch", type: "motion", beat: "You <em>stretch</em> until your spine lengthens and your joints wake up one by one." },
            { n: 3, label: "floor", type: "touch", beat: "Your bare feet find the <em>floor</em> — cool, solid, a little shock." },
            { n: 4, label: "curtains", type: "sound", beat: "You drag the <em>curtains</em> open and the rings rattle along the rail." },
            { n: 5, label: "bathroom door", type: "sound", beat: "The <em>bathroom door</em> creaks on the same hinge it always creaks on." },
            { n: 6, label: "toothbrush", type: "smell", beat: "The <em>toothbrush</em> floods your mouth with sharp mint." },
            { n: 7, label: "shower", type: "touch", beat: "The <em>shower</em> runs cold for three seconds before the heat arrives." },
            { n: 8, label: "towel", type: "touch", beat: "The <em>towel</em> is rough and smells of clean cotton." },
            { n: 9, label: "clothes", type: "motion", beat: "You pull on your <em>clothes</em> in the usual order, arms then buttons." },
            { n: 10, label: "kettle", type: "sound", beat: "The <em>kettle</em> builds from a whisper to a rolling growl and clicks off." },
            { n: 11, label: "mug", type: "touch", beat: "The <em>mug</em> warms both hands before the first sip does." },
            { n: 12, label: "toast", type: "smell", beat: "The <em>toast</em> pops, and the kitchen smells faintly of char." },
            { n: 13, label: "dishes", type: "sound", beat: "The <em>dishes</em> clink together in the sink as you rinse them." },
            { n: 14, label: "keys", type: "sound", beat: "You scoop up your <em>keys</em> and they jangle their little metal argument." },
            { n: 15, label: "front door", type: "sound", beat: "The <em>front door</em> shuts behind you with a firm double click." },
            { n: 16, label: "street", type: "sound", beat: "The <em>street</em> is already talking — engines, footsteps, a far-off dog." },
            { n: 17, label: "bus", type: "motion", beat: "The <em>bus</em> lurches as you grab the rail and sway with it." },
            { n: 18, label: "desk", type: "touch", beat: "You settle at your <em>desk</em> and the chair takes your weight with a sigh." },
            { n: 19, label: "lunch", type: "smell", beat: "<em>Lunch</em> is the best smell of the working day, and you take your time." },
            { n: 20, label: "walk", type: "motion", beat: "The afternoon <em>walk</em> loosens your legs and clears the fog." },
            { n: 21, label: "dinner", type: "smell", beat: "<em>Dinner</em> simmers, and the whole flat smells of onions and something good." },
            { n: 22, label: "couch", type: "touch", beat: "The <em>couch</em> accepts you completely; you sink an inch deeper than expected." },
            { n: 23, label: "lamp", type: "logic", beat: "You switch the <em>lamp</em> low, and the day starts winding itself down." },
            { n: 24, label: "blanket", type: "touch", beat: "The <em>blanket</em> comes up to your chin, heavy and warm." },
            { n: 25, label: "pillow", type: "touch", beat: "Your head lands on the <em>pillow</em>, and the day closes like a book." },
        ],
    },
    {
        id: "journey",
        name: "The Journey",
        tagline: "25 hooks · a quest where every beat causes the next",
        intro:
            "A chain of consequences: each stop happens because of the one " +
            "before it, so the story pulls itself forward. If you remember " +
            "why you moved, you remember where you went.",
        hooks: [
            { n: 1, label: "letter", type: "logic", beat: "A <em>letter</em> arrives asking you to come at once — so you must get ready." },
            { n: 2, label: "boots", type: "motion", beat: "Because you must go, you lace your <em>boots</em> tight, double-knotted." },
            { n: 3, label: "gate", type: "sound", beat: "The boots carry you to the <em>gate</em>, which swings open with a rusty complaint." },
            { n: 4, label: "path", type: "touch", beat: "Beyond the gate, the <em>path</em> crunches gravel under every step." },
            { n: 5, label: "crossroads", type: "logic", beat: "The path splits at a <em>crossroads</em> — you take the left fork, toward the water sound." },
            { n: 6, label: "bridge", type: "sound", beat: "The left fork leads to a wooden <em>bridge</em> that knocks hollow under your heels." },
            { n: 7, label: "river", type: "sound", beat: "Beneath the bridge the <em>river</em> is louder and colder than you expected." },
            { n: 8, label: "ferryman", type: "logic", beat: "The river is too wide to wade, so you call the <em>ferryman</em>." },
            { n: 9, label: "coin", type: "touch", beat: "The ferryman holds out a hand: one <em>coin</em>, cold and heavier than it looks." },
            { n: 10, label: "forest", type: "smell", beat: "Across the water waits the <em>forest</em>, all pine resin and damp earth." },
            { n: 11, label: "birdsong", type: "sound", beat: "Deep in the trees, <em>birdsong</em> stitches the silence together." },
            { n: 12, label: "rain", type: "touch", beat: "The birds hush because <em>rain</em> begins — fat drops, then sheets of it." },
            { n: 13, label: "cave", type: "touch", beat: "The rain drives you into a <em>cave</em>, dry but cold as a cellar." },
            { n: 14, label: "fire", type: "smell", beat: "Against the cold you strike a <em>fire</em>; smoke and warmth fill the dark." },
            { n: 15, label: "stranger", type: "sound", beat: "The firelight draws a <em>stranger</em>, who greets you in a gravelly voice." },
            { n: 16, label: "map", type: "touch", beat: "The stranger trades you a <em>map</em>, soft as cloth from years of folding." },
            { n: 17, label: "mountain", type: "logic", beat: "The map marks one destination: the <em>mountain</em>, so at dawn you climb." },
            { n: 18, label: "wind", type: "sound", beat: "High on the slope the <em>wind</em> howls and shoves you sideways." },
            { n: 19, label: "rope", type: "touch", beat: "Against the wind you tie a <em>rope</em>, rough fibers biting your palms." },
            { n: 20, label: "summit", type: "touch", beat: "The rope brings you to the <em>summit</em>, where the air is thin and electric." },
            { n: 21, label: "bell", type: "sound", beat: "At the summit hangs a <em>bell</em>; you ring it once, and it rolls like thunder." },
            { n: 22, label: "valley", type: "sound", beat: "The bell echoes down into the <em>valley</em>, answered by dogs and voices." },
            { n: 23, label: "village", type: "smell", beat: "The voices belong to a <em>village</em>, all woodsmoke and baking bread." },
            { n: 24, label: "feast", type: "smell", beat: "The village throws a <em>feast</em> — roasted everything, and honey after." },
            { n: 25, label: "home", type: "touch", beat: "Full and finished, you take the long road <em>home</em>, and your own bed at last." },
        ],
    },
];
