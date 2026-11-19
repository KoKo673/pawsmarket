import { useEffect, useRef, type RefObject } from 'react'

export interface OverflowHints<T extends HTMLElement = HTMLDivElement> {
  /** Put on the `position: relative` wrapper that draws the fades. */
  wrapperRef: RefObject<T | null>
  /** Put on the element that actually scrolls (`overflow-x: auto`). */
  scrollerRef: RefObject<T | null>
}

/**
 * Marks which physical edges of a horizontal scroller still hold cut-off
 * content, so the wrapper can draw a fade there.
 *
 * Why this exists at all: the shop category row hides its scrollbar (a
 * scrollbar on a chip strip steals vertical space and looks broken against
 * rounded pills) and that removes the ONLY cue that content continues past
 * the edge. Measured 2026-11-19 at 375px: 21 chips, 1443px unreachable to
 * the right, no scrollbar, no fade, no peek. The reader was expected to
 * discover most of the categories by accident.
 *
 * Hiding the scrollbar is a reasonable choice. Hiding the overflow is not.
 * So the cue has to be reconstructed in code from the element's geometry.
 *
 * ── Why two refs and not one ──────────────────────────────────────
 * The fade cannot live on the scroller itself: an absolutely positioned
 * child of a scroll container is laid out against its padding box and
 * SCROLLS with the content, so the gradient would slide away instead of
 * staying at the edge. It has to be on a non-scrolling wrapper. The
 * geometry has to be read from the scroller. Two elements, two refs.
 *
 * ── Why getBoundingClientRect and not scrollLeft or offsetLeft ──────
 * `scrollLeft` is the obvious signal and it is unusable here: on a
 * right-to-left page it starts at 0 and goes NEGATIVE in Firefox and
 * positive-from-the-other-end in Chromium and WebKit, with the convention
 * having changed between Chromium versions. Branching on browser behaviour
 * is not something to ship to Iranian phones.
 *
 * `offsetLeft` is relative to `offsetParent`, which depends on which
 * ancestor happens to be positioned — an accident of the surrounding
 * markup rather than a fact about the row.
 *
 * Rects are viewport coordinates, so "this child's right edge is past the
 * container's right edge" is a physical statement that is TRUE IN BOTH
 * DIRECTIONS WITH NO BRANCH. That is also why the dataset says `left` and
 * `right` rather than `start` and `end`: the CSS then needs no [dir] rules
 * at all, and cannot get them backwards. In RTL the remaining content is
 * physically on the left, and the fade follows it for free.
 *
 * ── Why a ResizeObserver as well as a scroll listener ─────────────
 * The chips arrive from an async query, so at mount the row is empty and
 * there is no overflow. A scroll-only listener would compute "no overflow"
 * once, never be called again, and the fade would be permanently absent on
 * the one page that needs it — a check that silently stops checking.
 */
export function useOverflowHints<T extends HTMLElement = HTMLDivElement>(): OverflowHints<T> {
  const wrapperRef = useRef<T | null>(null)
  const scrollerRef = useRef<T | null>(null)

  useEffect(() => {
    const el = scrollerRef.current
    const host = wrapperRef.current
    if (!el || !host) return

    // Sub-pixel tolerance: a fractional devicePixelRatio routinely reports a
    // 1px difference, and an affordance that lies is worse than none.
    const EPS = 2

    const update = () => {

      // ── The geometry, and why it is ONE subtraction ──────────────────
      // `scrollLeft` is unusable: RTL makes it negative in Firefox and
      // positive-from-the-other-end in Chromium, with the convention having
      // changed between versions. Branching on browser behaviour is not
      // something to ship.
      //
      // The first version of this file tested "is the LAST child past the
      // container's right edge", reasoning from viewport rects that it was
      // therefore direction-proof. Measured in the real page at 375px it
      // reported end=false with 1443px hidden: in an RTL flex row the first
      // child sits at the PHYSICAL right, so the last child is ~1329px to
      // the LEFT — never past the right edge. The comment claimed a property
      // that the code did not have.
      //
      // The direction-proof quantity is the overflow itself:
      //   overflow > 0        there is content outside the box, on exactly
      //                       one side, and which side is a flex-direction
      //                       and writing-mode question the layout already
      //                       answered. We only need to know that it exists.
      //   scrollX < 0         RTL, scrolled toward the end
      //   scrollX > 0         LTR, scrolled toward the end
      //   |scrollX| < overflow   something remains beyond the leading edge
      // Taking |scrollX| lets one expression serve both directions: in RTL
      // it grows from 0 to -overflow and the magnitude is the same curve.
      const overflow = el.scrollWidth - el.clientWidth
      const scrolled = Math.abs(el.scrollLeft)
      const edges: string[] = []

      if (overflow > EPS) {
        // Hidden content behind us, if we have moved at all.
        if (scrolled > EPS) edges.push('start')
        // Hidden content still ahead, if we have not reached the far end.
        // The loose tail is `overflow > EPS` again: at the end of the row
        // (scrolled == overflow) there is nothing left to advertise.
        if (overflow - scrolled > EPS) edges.push('end')
      }

      const value = edges.join(' ')
      // Write only on change. Setting a data attribute on every scroll event
      // invalidates style continuously and this row scrolls on every finger
      // move; the guard makes the steady state zero writes.
      if ((host.dataset.overflow ?? '') !== value) {
        if (value) host.dataset.overflow = value
        else delete host.dataset.overflow
      }
    }

    update()
    el.addEventListener('scroll', update, { passive: true })

    const ro = new ResizeObserver(update)
    ro.observe(el)
    // Observe the children too, for a resize of an individual chip (a
    // font swap can reflow every label).
    for (const child of Array.from(el.children)) ro.observe(child)

    // And a MutationObserver, because the two above cannot cover the case
    // that actually matters here. This effect runs once, at mount, when the
    // chip list is still loading and the row has NO children — so there is
    // nothing to attach a ResizeObserver to, and the row's own box is
    // width-capped by its parent so it may not resize either. The chips
    // arriving is the event that flips the verdict from "no overflow" to
    // "overflow", and without this the fade would be missing for the rest of
    // the page's life: a cue that silently fails to appear on the page that
    // needs it is the same defect as no cue at all.
    const mo = new MutationObserver(update)
    mo.observe(el, { childList: true })

    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  return { wrapperRef, scrollerRef }
}
