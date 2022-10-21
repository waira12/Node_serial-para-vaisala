const { SerialPort } = require('serialport')
const {promisify} = require('util')
const dayjs = require('dayjs')
const fs = require('fs')

const writeFileAsync = promisify(fs.writeFile)
const appendFileAsync = promisify(fs.appendFile)

const FILE_NAME = 'continous_data.csv'
const DELAY = 60000

const port = new SerialPort({
    path: 'COM8',
    baudRate: 115200,
    parity: 'none',
    dataBits: 8,
    stopBits: 1,
}).setEncoding('ascii')

port.on('open', async () => {
    setInterval(() => {
        if(port.writable) {
            port.write('meas --metric\r', 'binary')
        }
    }, DELAY)
    await writeFileAsync(FILE_NAME, 
    'NO2 (ug/m3),CO (ug/m3),O3 (ug/m3),NO (ug/m3),TEMP (C),HUM (%RH),PRES (hPa),Uptime (s),Date\n'
    )
})

port.on('readable', async () => {
    await new Promise(r => setTimeout(r, 100))
    const read = port.read()

    if (read) {
        const time = dayjs().toISOString()

        const lines = read.split('\n')
        const linesCleaned = lines.map((line) => line.trim())
        const subArray = linesCleaned.slice(1, 9)
        var values = subArray.map(variable => parseFloat(variable.split(': ')[1]))

        values.push(time)

        await appendFileAsync(
            FILE_NAME,
            `${values.join()}\n`
        )
    }
})

port.on('error', err => {
    console.error('error', err)
})
