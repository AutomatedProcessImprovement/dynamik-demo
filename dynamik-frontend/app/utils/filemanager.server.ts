import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { existsSync as exists } from 'fs'
import { hash } from 'hasha'

export async function saveFile(folder: string, file: File): Promise<string> {
    const content = await file.text()
    const checksum = await hash(content, {algorithm: 'md5'})
    const filename = `${checksum}.csv`

    return writeToFile(folder, filename, content)
}

export async function storeFiles(folder: string, files: File[]): Promise<string[]> {
    return Promise.all(
        files.map(file => saveFile(folder, file))
    )
}

export async function writeToFile(folder: string, filename: string, content: string) {
    const basePath =  process.env.BASE_DATA_PATH || '../dynamik-data'
    const folderPath = join(basePath, folder)

    if (!exists(folderPath))
        await mkdir(folderPath, { recursive: true })

    if (!exists(join(folderPath, filename))) {
        await writeFile(join(folderPath, filename), content)
    }

    return filename
}

export async function readFromFile<T>(folder: string, filename: string, transform: (content: string) => T): Promise<T> {
    const basePath =  process.env.BASE_DATA_PATH || '../dynamik-data'
    const folderPath = join(basePath, folder)
    const fullPath = join(folderPath, filename)

    if(exists(fullPath)) {
        const content = await readFile(fullPath, { encoding: 'utf8' })
        return transform(content)
    } else {
        throw new Error(`File '${fullPath}' does not exist`)
    }
}

export function existsFile(folder: string, filename: string): boolean {
    const basePath =  process.env.BASE_DATA_PATH || '../dynamik-data'
    const folderPath = join(basePath, folder)
    const fullPath = join(folderPath, filename)

    return exists(fullPath)
}