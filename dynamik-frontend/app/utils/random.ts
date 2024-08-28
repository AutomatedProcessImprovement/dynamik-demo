export function random(min = 0, max: number): number {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min)) + Math.ceil(min))
}

export function pickRandom<T>(data: T[], sampleSize: number, allowRepeat: boolean = false): T[] {
    const item = random(0, data.length - 1)

    if (sampleSize > 1) {
        if (allowRepeat) {
            return [ data[item], ...pickRandom(data, sampleSize - 1) ]
        } else {
            return [ data[item], ...pickRandom([ ...data.slice(0, item), ...data.slice(item + 1, data.length)], sampleSize - 1) ]
        }
    } else {
        return [ data[item] ]
    }
}