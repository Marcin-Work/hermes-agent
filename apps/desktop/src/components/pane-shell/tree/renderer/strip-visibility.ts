/**
 * Does this zone show its tab strip? One resolver, one precedence order, so
 * every caller gets the same answer and the rule can be read in one place.
 *
 * The decision used to be an inline expression in TreeGroup fed by a flag four
 * other code paths also wrote to, which is how a zone could end up with no
 * strip, no tab, no ✕ and no menu to get any of them back. The ladder below is
 * the whole policy; nothing outside `mode` is persisted, so a zone's chrome is
 * a function of what it currently holds plus one deliberate choice.
 */

export interface StripPane {
  /** A tool panel (terminal / logs) that collapses rather than closes. */
  collapsePane: boolean
  /** Contribution placement — `'main'` marks a docked tile (session, page,
   *  preview) as opposed to standing side chrome. */
  placement?: string
  /** Panes that never leave the tree (the workspace). */
  uncloseable?: boolean
}

export interface StripZone {
  /** The ACTIVE pane declines to be tabbed (a full-page view). */
  headerVeto?: boolean
  /** The zone's standing choice; undefined = auto. */
  mode?: 'always' | 'never'
  /** Panes currently rendered as chips — chrome-hidden and narrow-collapsed
   *  panes are already filtered out. */
  shown: readonly StripPane[]
}

/**
 * A pane is STRANDED without a strip when the strip is the only thing carrying
 * its handle: a closeable tile needs its ✕, a lone tool panel needs a chip to
 * grab. The uncloseable workspace is not strandable — it cannot be closed or
 * lost, so a lone chat is free to be chromeless.
 *
 * This outranks an explicit `never` on purpose. "Hide the strip" is a request
 * about chrome, never a request to make a surface unreachable, and a zone that
 * answers no gesture at all is not a state any setting should be able to
 * produce. Hiding still works everywhere it cannot trap you.
 */
function stranded(shown: readonly StripPane[]): boolean {
  if (shown.some(pane => !pane.uncloseable && pane.placement === 'main')) {
    return true
  }

  return shown.length === 1 && shown[0].collapsePane
}

export function resolveTabStripVisible(zone: StripZone): boolean {
  if (zone.shown.length === 0) {
    return false
  }

  // A page is not a tab-able surface. Contextual and self-lifting: the strip
  // returns with the chat, so it is resolved ahead of any stored choice and
  // never written down.
  if (zone.headerVeto) {
    return false
  }

  if (stranded(zone.shown)) {
    return true
  }

  if (zone.mode) {
    return zone.mode === 'always'
  }

  // Auto: a lone pane is not a "tab", so it goes without a strip; two or more
  // need one to switch between them.
  return zone.shown.length > 1
}
