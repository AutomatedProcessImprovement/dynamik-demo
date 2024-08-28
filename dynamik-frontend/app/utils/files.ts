export async function readLines(
    file: File,
    options?: {
        lines?: number,
        removeWhite?: boolean
    }
): Promise<string[]> {
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
        reader.onerror = () => {
            reader.abort()
            reject(`Error while parsing file ${file.name}.`)
        }

        reader.onabort = () => {
            reader.abort()
            reject(`Error while parsing file ${file.name}.`)
        }

        reader.onload = () => {
            let content = (options?.lines && options?.lines > 0)
                ? (reader.result as string).split(/\r\n|\r|\n/, options.lines)
                : (reader.result as string).split(/\r\n|\r|\n/)

            content = options?.removeWhite ? content.filter(line => line.length !== 0) : content

            resolve(content)
        }

        reader.readAsText(file)
    })
}

export async function parseHeader(file: File){
    const headers = new Set<string>()

    const lines = await readLines(file, {lines: 1})

    for (const word of lines[0].split(',')) {
        headers.add(word)
    }

    return headers
}