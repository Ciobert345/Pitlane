import { useEffect, useRef, useState } from "react";
import type { PositionCar } from "@/types/state.type";

/**
 * Spring-based smooth position tracking.
 *
 * Uses the "exponential decay per frame" technique from game development:
 * each frame, the displayed position moves a fixed FRACTION of the remaining
 * distance toward the target. This is:
 *   - Immune to update rate: doesn't matter if data comes every 50ms or 500ms
 *   - Self-correcting: large jumps are caught up quickly, small adjustments decelerate
 *   - Zero teleportation: the position never jumps, it always slides
 *
 * SPRING_FACTOR controls the feel:
 *   0.05 = very floaty/slow  (moves 5% of remaining distance per frame)
 *   0.12 = natural/smooth    (default, reaches ~99% in ~35 frames = ~600ms)
 *   0.25 = snappy            (reaches ~99% in ~15 frames = ~250ms)
 */
const SPRING_FACTOR = 0.10;
const THRESHOLD = 0.5; // Stop animating when this close (SVG units)

export function useLerpPosition(targetPos: PositionCar | null) {
	const [displayPos, setDisplayPos] = useState<PositionCar | null>(targetPos);

	// Current animated position — in a ref so it persists across renders
	// without triggering them, and is always fresh in the rAF callback
	const currentX = useRef<number>(targetPos?.X ?? 0);
	const currentY = useRef<number>(targetPos?.Y ?? 0);

	// Target position ref — updated whenever new data arrives
	const targetX = useRef<number>(targetPos?.X ?? 0);
	const targetY = useRef<number>(targetPos?.Y ?? 0);
	const targetMeta = useRef<PositionCar | null>(targetPos);

	const rafRef = useRef<number>(0);

	// Update target whenever prop changes
	useEffect(() => {
		if (!targetPos) return;
		targetX.current = targetPos.X;
		targetY.current = targetPos.Y;
		targetMeta.current = targetPos;
	}, [targetPos]);

	// Single persistent animation loop — runs forever at 60fps
	useEffect(() => {
		const animate = () => {
			if (targetMeta.current !== null) {
				const dx = targetX.current - currentX.current;
				const dy = targetY.current - currentY.current;

				if (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD) {
					// Spring: move a fraction of remaining distance each frame
					currentX.current += dx * SPRING_FACTOR;
					currentY.current += dy * SPRING_FACTOR;

					setDisplayPos({
						...targetMeta.current,
						X: currentX.current,
						Y: currentY.current,
					});
				}
				// If within threshold, no state update → no render → no CPU waste
			}

			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(rafRef.current);
	}, []); // Intentionally empty: this loop runs for the lifetime of the component

	return displayPos;
}
