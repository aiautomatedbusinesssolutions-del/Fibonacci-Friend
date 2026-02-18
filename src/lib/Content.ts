/**
 * "Bar Friend" dictionary — every term explained like you're talking
 * to a friend at a bar. Uses Energy / Momentum language.
 * Always probability-framed: "likely", "historically" — never "guaranteed."
 */
export const barFriend: Record<
  string,
  { friendly: string; detail: string }
> = {
  Retracement: {
    friendly: "The Pullback",
    detail:
      "After a big move, price often pulls back to catch its breath before the next push. That rest stop is the pullback — totally normal, and historically a chance to hop on board.",
  },
  "Golden Ratio": {
    friendly: "The Sweet Spot",
    detail:
      "61.8 % — the level traders watch most. It shows up in sunflowers, seashells, and stock charts. Historically, price likes to bounce right here, which is why we call it the Sweet Spot.",
  },
  "Swing High": {
    friendly: "The Peak",
    detail:
      "The highest point price reached before it started cooling off. Think of it as the top of a roller coaster — we find it automatically so you don't have to.",
  },
  "Swing Low": {
    friendly: "The Valley",
    detail:
      "The lowest point price hit before energy started building again. It's the bottom of the dip — our algorithm spots it for you.",
  },
  "Support Level": {
    friendly: "The Safety Net",
    detail:
      "A price level where buyers historically step in and catch the fall. Like a trampoline — price tends to bounce off it, though nothing is guaranteed.",
  },
  "Resistance Level": {
    friendly: "The Ceiling",
    detail:
      "A price level where sellers historically push price back down. Think of it as a glass ceiling — hard to break through, but not impossible.",
  },
  Extension: {
    friendly: "The Stretch Goal",
    detail:
      "Where price might go *beyond* the previous peak. It's your potential profit target — how far the momentum could carry if everything lines up.",
  },
  Confluence: {
    friendly: "The Stack-Up",
    detail:
      "When multiple signals point to the same price level. The more evidence that stacks up, the more likely that level matters — like getting a second and third opinion before making a call.",
  },
  Uptrend: {
    friendly: "Building Energy",
    detail:
      "Price is making higher peaks and higher valleys — momentum is pushing upward. Historically, pullbacks in an uptrend are buying opportunities.",
  },
  Downtrend: {
    friendly: "Fading Energy",
    detail:
      "Price is making lower peaks and lower valleys — momentum is cooling off. Bounces in a downtrend are historically weaker and often fade.",
  },
  Momentum: {
    friendly: "The Push",
    detail:
      "How much energy is behind a price move. Strong momentum means the move is likely to keep going; weak momentum means it could stall out.",
  },
} as const;

/**
 * Standard disclaimer shown on every analysis screen.
 */
export const disclaimer =
  "This tool shows historical patterns and probabilities — not guarantees. Always do your own research before making any trading decisions.";
