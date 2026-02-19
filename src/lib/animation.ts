export const spring = {
    stiff: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        restDelta: 0.001
    },
    default: {
        type: "spring",
        stiffness: 350,
        damping: 40,
        mass: 1,
        restDelta: 0.001
    },
    soft: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        restDelta: 0.001
    }
} as const;

export const ease = {
    out: [0.22, 1, 0.36, 1], // easeOutQuint
    in: [0.64, 0, 0.78, 0],  // easeInQuint
    inOut: [0.83, 0, 0.17, 1] // easeInOutQuint
} as const;

export const duration = {
    fast: 0.2,
    default: 0.3,
    slow: 0.5
} as const;
