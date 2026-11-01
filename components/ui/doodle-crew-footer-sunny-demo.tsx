"use client"

import DoodleCrewFooter from "@/components/ui/doodle-crew-footer-sunny"

// A different brand on the yellow comic-page preset: shorter word, its own
// crew and lines, a smaller sky of doodles.
export default function DemoSunny() {
  return (
    <div className="w-full">
      <DoodleCrewFooter
        preset="sunny"
        wordmark="PICNIC"
        brand="picnic club"
        blurb="Small-batch snacks, packed by hand and delivered by bike every Saturday morning."
        tagline="Lunch, but make it an adventure."
        actions={[
          { label: "Build a basket", href: "#", icon: "sandwich", variant: "outline" },
          { label: "Order now", href: "#", icon: "heart", variant: "solid" },
        ]}
        crew={[
          { kind: "cat", letter: 0, seat: "front", offset: -0.36, name: "Patch", says: "I only eat the fancy tuna." },
          { kind: "bird", letter: 1, seat: "top", name: "Pip", says: "Crumbs? Any crumbs?" },
          { kind: "ghost", letter: 3, seat: "behind", name: "Boo", says: "I'm here for the cheese." },
          { kind: "kid", letter: 4, seat: "top", offset: 0.05, name: "Juno", says: "Window seat!" },
          { kind: "yeti", letter: 5, seat: "front", offset: 0.4, scale: 0.92, flip: true, name: "Bruno", says: "Seconds, please." },
        ]}
        doodles={["sandwich", "heart", "star", "sandwich", "sparkle"]}
        doodleCount={10}
        columns={[
          { title: "Menu", links: [{ label: "Baskets", href: "#" }, { label: "Drinks", href: "#" }, { label: "Sweets", href: "#" }] },
          { title: "Club", links: [{ label: "Membership", href: "#" }, { label: "Gift a basket", href: "#" }, { label: "FAQ", href: "#" }] },
          { title: "Say hi", links: [{ label: "Instagram", href: "#" }, { label: "hello@picnic.club", href: "#" }] },
        ]}
        copyright="© 2026 Picnic Club, Oakland CA"
      />
    </div>
  )
}
