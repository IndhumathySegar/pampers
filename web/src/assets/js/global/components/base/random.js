const rnumber = function xoshiro128p() {
    // Using the same value for each seed is _screamingly_ wrong
    // but this is 'good enough' for a toy function.
    let a = Date.now(),
        b = Date.now(),
        c = Date.now(),
        d = Date.now()
    return function () {
        let t = b << 9,
            r = a + d
        c = c ^ a
        d = d ^ b
        b = b ^ c
        a = a ^ d
        c = c ^ t
        d = (d << 11) | (d >>> 21)
        return (r >>> 0) / 4294967296
    }
}()

function defaults(options) {
    options = options || {}
    var min = options.min
    var max = options.max
    var integer = options.integer || false
    if (min == null && max == null) {
        min = 0
        max = 1
    } else if (min == null) {
        min = max - 1
    } else if (max == null) {
        max = min + 1
    }
    if (max < min) throw new Error('invalid options, max must be >= min')
    return {
        min: min
        , max: max
        , integer: integer
    }
}

function rn(options) {
    options = defaults(options)
    if (options.max === options.min) return options.min
    var r = rnumber() * (options.max - options.min + Number(!!options.integer)) + options.min
    return options.integer ? Math.floor(r) : r
}