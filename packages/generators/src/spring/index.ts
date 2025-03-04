import { time } from "@motionone/utils"
import { AnimationGenerator, AnimationGeneratorState } from "@motionone/types"
import { defaults } from "./defaults"
import { SpringOptions } from "./types"
import { calcDampingRatio } from "./utils"
import { hasReachedTarget } from "../utils/has-reached-target"
import { calcGeneratorVelocity } from "../utils/velocity"

export const spring = ({
  stiffness = defaults.stiffness,
  damping = defaults.damping,
  mass = defaults.mass,
  from = 0,
  to = 1,
  velocity = 0.0,
  restSpeed = 2,
  restDistance = 0.5,
}: SpringOptions = {}): AnimationGenerator => {
  velocity = velocity ? time.s(velocity) : 0.0

  const state: AnimationGeneratorState = {
    done: false,
    hasReachedTarget: false,
    current: from,
    target: to,
  }

  const initialDelta = to - from
  const undampedAngularFreq = Math.sqrt(stiffness / mass) / 1000
  const dampingRatio = calcDampingRatio(stiffness, damping, mass)

  let resolveSpring: (t: number) => number

  if (dampingRatio < 1) {
    const angularFreq =
      undampedAngularFreq * Math.sqrt(1 - dampingRatio * dampingRatio)

    // Underdamped spring (bouncy)
    resolveSpring = (t) =>
      to -
      Math.exp(-dampingRatio * undampedAngularFreq * t) *
        (((-velocity + dampingRatio * undampedAngularFreq * initialDelta) /
          angularFreq) *
          Math.sin(angularFreq * t) +
          initialDelta * Math.cos(angularFreq * t))
  } else {
    // Critically damped spring
    resolveSpring = (t) => {
      return (
        to -
        Math.exp(-undampedAngularFreq * t) *
          (initialDelta + (-velocity + undampedAngularFreq * initialDelta) * t)
      )
    }
  }

  return (t: number) => {
    state.current = resolveSpring(t)

    const currentVelocity =
      t === 0
        ? velocity
        : calcGeneratorVelocity(resolveSpring, t, state.current)
    const isBelowVelocityThreshold = Math.abs(currentVelocity) <= restSpeed
    const isBelowDisplacementThreshold =
      Math.abs(to - state.current) <= restDistance
    state.done = isBelowVelocityThreshold && isBelowDisplacementThreshold
    state.hasReachedTarget = hasReachedTarget(from, to, state.current)

    return state
  }
}
